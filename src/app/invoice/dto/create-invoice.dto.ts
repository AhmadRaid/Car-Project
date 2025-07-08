import { IsNotEmpty, IsString, IsDate, IsArray, IsNumber, IsOptional, IsEnum } from 'class-validator';

class InvoiceItemDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsNotEmpty()
  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;
}

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsDate()
  issueDate: Date;

  @IsNotEmpty()
  @IsDate()
  dueDate: Date;

  @IsNotEmpty()
  @IsArray()
  items: InvoiceItemDto[];

  @IsOptional()
  @IsNumber()
  discount?: number;

//   @IsOptional()
//   @IsEnum(InvoiceStatus)
//   status?: InvoiceStatus;

//   @IsOptional()
//   @IsEnum(PaymentMethod)
//   paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}