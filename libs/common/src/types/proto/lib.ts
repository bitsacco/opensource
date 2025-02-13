// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.2.7
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

export interface FmInvoice {
  /** Fallback invoice */
  invoice: string;
  operationId: string;
}
