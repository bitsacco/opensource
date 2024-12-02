import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CreateOnrampSwapDto,
  Currency,
  DepositFundsRequestDto,
  DepositFundsResponse,
  DepositsMeta,
  fedimint_receive_failure,
  fedimint_receive_success,
  FedimintService,
  fiatToBtc,
  FindUserDepositTxsResponse,
  FindUserTxsRequestDto,
  FmInvoice,
  PaginatedSolowalletTxsResponse,
  QuoteDto,
  QuoteRequestDto,
  QuoteResponse,
  ReceiveContext,
  type ReceivePaymentFailureEvent,
  type ReceivePaymentSuccessEvent,
  SWAP_SERVICE_NAME,
  SwapResponse,
  SwapServiceClient,
  TransactionStatus,
} from '@bitsacco/common';
import { type ClientGrpc } from '@nestjs/microservices';
import { catchError, firstValueFrom, map, of, tap } from 'rxjs';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { SolowalletRepository } from './db';

@Injectable()
export class SolowalletService {
  private readonly logger = new Logger(SolowalletService.name);
  private readonly swapService: SwapServiceClient;

  constructor(
    private readonly wallet: SolowalletRepository,
    private readonly fedimintService: FedimintService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(SWAP_SERVICE_NAME) private readonly swapGrpc: ClientGrpc,
  ) {
    this.logger.log('SolowalletService created');
    this.swapService =
      this.swapGrpc.getService<SwapServiceClient>(SWAP_SERVICE_NAME);

    this.eventEmitter.on(
      fedimint_receive_success,
      this.handleSuccessfulReceive.bind(this),
    );
    this.eventEmitter.on(
      fedimint_receive_failure,
      this.handleFailedReceive.bind(this),
    );
    this.logger.log('SwapService initialized');
  }

  private async getQuote({ from, to, amount }: QuoteRequestDto): Promise<{
    quote: QuoteDto | null;
    amountMsats: number;
  }> {
    return firstValueFrom(
      this.swapService
        .getQuote({
          from,
          to,
          amount,
        })
        .pipe(
          tap((quote: QuoteResponse) => {
            this.logger.log(`Quote: ${quote}`);
          }),
          map((quote: QuoteResponse) => {
            const { amountMsats } = fiatToBtc({
              amountFiat: Number(amount),
              btcToFiatRate: Number(quote.rate),
            });

            return {
              quote: {
                id: quote.id,
                refreshIfExpired: true,
              },
              amountMsats,
            };
          }),
        )
        .pipe(
          catchError((error) => {
            this.logger.error('Error geeting quote:', error);
            return of({
              amountMsats: 0,
              quote: null,
            });
          }),
        ),
    );
  }

  private async initiateSwap(fiatDeposit: CreateOnrampSwapDto): Promise<{
    status: TransactionStatus;
    amountMsats: number;
    amountFiat: number;
    reference: string;
  }> {
    const reference = fiatDeposit.reference;
    const amountFiat = Number(fiatDeposit.amountFiat);

    return firstValueFrom(
      this.swapService
        .createOnrampSwap(fiatDeposit)
        .pipe(
          tap((swap: SwapResponse) => {
            this.logger.log(`Swap: ${swap}`);
          }),
          map((swap: SwapResponse) => {
            const { amountMsats } = fiatToBtc({
              amountFiat,
              btcToFiatRate: Number(swap.rate),
            });

            return {
              status: swap.status,
              amountMsats,
              amountFiat,
              reference,
            };
          }),
        )
        .pipe(
          catchError((error) => {
            this.logger.error('Error in swap:', error);
            return of({
              status: TransactionStatus.FAILED,
              amountMsats: 0,
              amountFiat,
              reference,
            });
          }),
        ),
    );
  }

  private async getPaginatedUserDeposits({
    userId,
    pagination,
  }: FindUserTxsRequestDto): Promise<PaginatedSolowalletTxsResponse> {
    const allDeposits = await this.wallet.find({ userId }, { createdAt: -1 });

    const { page, size } = pagination;
    const pages = Math.ceil(allDeposits.length / size);

    // select the last page if requested page exceeds total pages possible
    const selectPage = page > pages ? pages - 1 : page;

    const deposits = allDeposits
      .slice(selectPage * size, (selectPage + 1) * size + size)
      .map((deposit) => {
        let lightning: FmInvoice;
        try {
          lightning = JSON.parse(deposit.lightning);
        } catch (error) {
          this.logger.warn('Error parsing lightning invoice', error);
          lightning = {
            invoice: '',
            operationId: '',
          };
        }

        let status = TransactionStatus.UNRECOGNIZED;
        try {
          status = Number(deposit.status) as TransactionStatus;
        } catch (error) {
          this.logger.warn('Error parsing deposit status', error);
        }

        return {
          ...deposit,
          status,
          lightning,
          paymentTracker: lightning.operationId,
          id: deposit._id,
          createdAt: deposit.createdAt.toDateString(),
          updatedAt: deposit.updatedAt.toDateString(),
        };
      });

    return {
      transactions: deposits,
      page: selectPage,
      size,
      pages,
    };
  }

  private async getDepositsMeta(
    userId: string,
  ): Promise<DepositsMeta | undefined> {
    let meta: DepositsMeta = undefined;
    try {
      meta = await this.wallet
        .aggregate([
          {
            $match: {
              userId: userId,
              status: TransactionStatus.COMPLETE,
            },
          },
          {
            $group: {
              _id: '$userId',
              totalMsats: { $sum: '$amountMsats' },
              avgMsats: { $avg: '$amountMsats' },
              count: { $sum: 1 },
            },
          },
        ])
        .then((result) => {
          return result[0];
        });
    } catch (e) {
      this.logger.error('Error getting deposits meta', e);
    }

    return meta;
  }

  async depositFunds({
    userId,
    amountFiat,
    reference,
    onramp,
  }: DepositFundsRequestDto): Promise<DepositFundsResponse> {
    const { quote, amountMsats } = await this.getQuote({
      from: onramp?.currency || Currency.KES,
      to: Currency.BTC,
      amount: amountFiat.toString(),
    });

    const lightning = await this.fedimintService.invoice(
      amountMsats,
      reference,
    );

    const { status } = onramp
      ? await this.initiateSwap({
          quote,
          amountFiat: amountFiat.toString(),
          reference,
          source: onramp,
          target: {
            payout: lightning,
          },
        })
      : {
          status: TransactionStatus.PENDING,
        };

    this.logger.log(status);
    const deposit = await this.wallet.create({
      userId,
      amountMsats,
      amountFiat,
      lightning: JSON.stringify(lightning),
      paymentTracker: lightning.operationId,
      status,
      reference,
    });

    // listen for payment
    this.fedimintService.receive(
      ReceiveContext.SOLOWALLET,
      lightning.operationId,
    );

    const deposits = await this.getPaginatedUserDeposits({
      userId,
      pagination: { page: 0, size: 10 },
    });

    const meta = await this.getDepositsMeta(userId);

    return {
      txId: deposit._id,
      deposits,
      meta,
    };
  }

  async findUserDeposits({
    userId,
    pagination,
  }: FindUserTxsRequestDto): Promise<FindUserDepositTxsResponse> {
    const deposits = await this.getPaginatedUserDeposits({
      userId,
      pagination,
    });
    const meta = await this.getDepositsMeta(userId);

    return {
      deposits,
      meta,
    };
  }

  @OnEvent(fedimint_receive_success)
  private async handleSuccessfulReceive({
    context,
    operationId,
  }: ReceivePaymentSuccessEvent) {
    await this.wallet.findOneAndUpdate(
      { paymentTracker: operationId },
      {
        status: TransactionStatus.COMPLETE,
      },
    );

    this.logger.log(
      `Received lightning payment for ${context} : ${operationId}`,
    );
  }

  @OnEvent(fedimint_receive_failure)
  private async handleFailedReceive({
    context,
    operationId,
  }: ReceivePaymentFailureEvent) {
    this.logger.log(
      `Failed to receive lightning payment for ${context} : ${operationId}`,
    );

    await this.wallet.findOneAndUpdate(
      { paymentTracker: operationId },
      {
        state: TransactionStatus.FAILED,
      },
    );
  }
}
