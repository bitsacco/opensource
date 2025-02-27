// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.6.1
//   protoc               v3.20.3
// source: lib.proto

/* eslint-disable */

/** TransactionStatus: Enum representing the possible statuses of a transaction. */
export enum TransactionStatus {
  PENDING = 0,
  PROCESSING = 1,
  FAILED = 2,
  COMPLETE = 3,
  UNRECOGNIZED = -1,
}

export enum TransactionType {
  DEPOSIT = 0,
  WITHDRAW = 1,
  UNRECOGNIZED = -1,
}

/** Currency: Enum representing supported currencies. */
export enum Currency {
  BTC = 0,
  KES = 1,
  UNRECOGNIZED = -1,
}

export interface Empty {}

export interface PaginatedRequest {
  /** Page offset to start from */
  page: number;
  /** Number of items to be return per page */
  size: number;
}

export interface FindTxRequest {
  txId: string;
}

export interface OnrampSwapSource {
  /** Currency code for the target currency */
  currency: Currency;
  /** Target destination */
  origin: MobileMoney | undefined;
}

export interface OnrampSwapTarget {
  /** Lightning protocol payout */
  payout: Bolt11 | undefined;
}

export interface OfframpSwapTarget {
  /** Currency code for the target currency */
  currency: Currency;
  /** Mobile money payout destination */
  payout: MobileMoney | undefined;
}

export interface MobileMoney {
  /** Phone number for the mobile money offramp */
  phone: string;
}

export interface Bolt11 {
  /** Bolt11 lightning invoice */
  invoice: string;
}

export interface FmLightning {
  invoice?: string | undefined;
  operationId?: string | undefined;
  lnurlWithdrawPoint?: LnUrlWithdrawPoint | undefined;
}

/**
 * Message returned as `FmLightning`
 * when a user want's to withdraw from Bitsacco wallet via LNURL
 *
 * REF: https://github.com/lnurl/luds/blob/luds/03.md step 3
 */
export interface LnUrlWithdrawPoint {
  /** The LNURL bech32 encoded string to be encoded as QR code */
  lnurl: string;
  /** Key used for withdrawal (k1 parameter) */
  k1: string;
  /** URL that will handle the withdrawal callback */
  callback: string;
  /** When the withdrawal request expires (Unix timestamp) */
  expiresAt?: number | undefined;
}

/**
 * Message serializing request parameters from GET request
 * to bitsacco LNURL service `callback`
 *
 * REF: https://github.com/lnurl/luds/blob/luds/03.md step 5
 */
export interface LnUrlWithdrawPointCall {
  /** Key used for withdrawal (k1 parameter) */
  k1: string;
  /** This is a payment request (pr parameter) generated by user `LN WALLET` */
  payout: Bolt11 | undefined;
}

/**
 * Message returned from  `LnUrlWithdrawPoint.callback`
 * when a user's `LN WALLET` makes a GET request with invoice and params
 *
 * REF: https://github.com/lnurl/luds/blob/luds/03.md step 6
 */
export interface LnUrlWithdrawResponse {
  /** "OK" or "ERROR" */
  status: string;
  /** error reason if `status` = "ERROR" */
  reason?: string | undefined;
}
