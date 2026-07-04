import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentLedgerDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  paymentMethodCode!: string; // 'cash', 'card', 'bank_transfer'

  @IsString()
  @IsNotEmpty()
  paymentStatusCode!: string; // 'paid', 'refunded', 'failed'

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsOptional()
  provider?: string; // 'stripe', 'cod', etc.

  @IsString()
  @IsOptional()
  providerReference?: string; // transaction reference number
}
