import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class GuaranteeDto {
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsNotEmpty()
  @IsString()
  endDate: string;
}

class ServiceDto {
  @IsNotEmpty()
  @IsString()
  serviceType: string;

  @IsNotEmpty()
  @IsNumber()
  servicePrice: number;

  @IsOptional()
  //   @ValidateNested()
  //   @Type(() => GuaranteeDto)
  guarantee?: any;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderForExistingClientDto {
  @IsNotEmpty()
  @IsString()
  carType: string;

  @IsNotEmpty()
  @IsString()
  carModel: string;

  @IsNotEmpty()
  @IsString()
  carColor: string;

  @IsNotEmpty()
  @IsString()
  carPlateNumber: string;

  @IsOptional()
  @IsString()
  carManufacturer?: string;

  @IsOptional()
  @IsString()
  carSize?: string;


  @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => ServiceDto)
  services: ServiceDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  invoiceNotes?: string;
}
