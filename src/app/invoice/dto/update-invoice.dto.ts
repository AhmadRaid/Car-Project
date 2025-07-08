import { IsOptional, IsString, IsDate, IsArray, IsNumber, IsEnum } from 'class-validator';

class UpdateInvoiceItemDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  taxRate?: number;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsDate()
  issueDate?: Date;

  @IsOptional()
  @IsDate()
  dueDate?: Date;

  @IsOptional()
  @IsArray()
  items?: UpdateInvoiceItemDto[];

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
  @IsDate()
  paymentDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}