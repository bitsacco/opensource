import { Type } from 'class-transformer';
import {
  IsNumber,
  IsEnum,
  IsOptional,
  ValidateNested,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsRequiredUUID, PaginatedRequestDto } from './lib.dto';
import {
  ChamaTxsFilterRequest,
  ChamaTxStatus,
  type PaginatedRequest,
} from '../types';

export class DepositDto {
  @IsRequiredUUID()
  @ApiProperty({ example: '7b158dfd-cb98-40b1-9ed2-a13006a9f670' })
  chamaId: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 1000 })
  amount: number;

  @IsRequiredUUID()
  @ApiProperty({ example: '7b158dfd-cb98-40b1-9ed2-a13006a9f670' })
  userId: string;
}

export class ContinueDepositDto {
  @IsRequiredUUID()
  @ApiProperty({ example: '7b158dfd-cb98-40b1-9ed2-a13006a9f670' })
  transactionId: string;
}

export class WithdrawFundsDto {
  @IsRequiredUUID()
  @ApiProperty({ example: '7b158dfd-cb98-40b1-9ed2-a13006a9f670' })
  chamaId: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 1000 })
  amount: number;

  @IsRequiredUUID()
  @ApiProperty({ example: '7b158dfd-cb98-40b1-9ed2-a13006a9f670' })
  userId: string;
}

export class ContinueWithdrawDto {
  @IsRequiredUUID()
  @ApiProperty({ example: '7b158dfd-cb98-40b1-9ed2-a13006a9f670' })
  transactionId: string;
}

export class UpdateTransactionDto {
  @IsRequiredUUID()
  @ApiProperty({ example: '7b158dfd-cb98-40b1-9ed2-a13006a9f670' })
  transactionId: string;

  @IsEnum(ChamaTxStatus)
  @ApiProperty({ enum: ChamaTxStatus })
  status: ChamaTxStatus;
}

export class FindTransactionDto {
  @IsRequiredUUID()
  @ApiProperty({ example: '7b158dfd-cb98-40b1-9ed2-a13006a9f670' })
  transactionId: string;
}

export class FilterChamaTransactionsDto implements ChamaTxsFilterRequest {
  @IsOptional()
  @IsRequiredUUID()
  @ApiProperty({
    example: '7b158dfd-cb98-40b1-9ed2-a13006a9f670',
    required: false,
  })
  memberId?: string;

  @IsOptional()
  @IsRequiredUUID()
  @ApiProperty({
    example: '7b158dfd-cb98-40b1-9ed2-a13006a9f670',
    required: false,
  })
  chamaId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginatedRequestDto)
  @ApiProperty({ type: PaginatedRequestDto })
  pagination?: PaginatedRequest;
}
