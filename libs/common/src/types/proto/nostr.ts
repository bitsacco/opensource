// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.2.7
//   protoc               v3.21.12
// source: nostr.proto

/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { Empty } from './lib';

export interface ConfigureNostrRelaysRequest {
  relays: NostrRelay[];
}

export interface NostrDirectMessageRequest {
  message: string;
  recipient: NostrRecipient | undefined;
  retry: boolean;
}

export interface NostrRecipient {
  npub?: string | undefined;
  pubkey?: string | undefined;
}

export interface NostrRelay {
  socket: string;
  read: boolean;
  write: boolean;
}

export interface NostrServiceClient {
  configureTrustedNostrRelays(
    request: ConfigureNostrRelaysRequest,
  ): Observable<Empty>;

  sendEncryptedNostrDirectMessage(
    request: NostrDirectMessageRequest,
  ): Observable<Empty>;
}

export interface NostrServiceController {
  configureTrustedNostrRelays(
    request: ConfigureNostrRelaysRequest,
  ): Promise<Empty> | Observable<Empty> | Empty;

  sendEncryptedNostrDirectMessage(
    request: NostrDirectMessageRequest,
  ): Promise<Empty> | Observable<Empty> | Empty;
}

export function NostrServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      'configureTrustedNostrRelays',
      'sendEncryptedNostrDirectMessage',
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcMethod('NostrService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(
        constructor.prototype,
        method,
      );
      GrpcStreamMethod('NostrService', method)(
        constructor.prototype[method],
        method,
        descriptor,
      );
    }
  };
}

export const NOSTR_SERVICE_NAME = 'NostrService';