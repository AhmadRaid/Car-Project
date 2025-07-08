import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsDate,
  IsNumber,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { GuaranteeDto } from './guarantee.dto';

export class ServiceDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['polish', 'protection', 'insulator', 'additions'])
  serviceType: string;

  @IsString()
  @IsOptional()
  dealDetails?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['glossy', 'matte', 'colored'])
  protectionFinish?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['10', '8', '7.5', '6.5'])
  protectionSize?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['full', 'half', 'quarter', 'edges', 'other'])
  protectionCoverage?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['ceramic', 'carbon', 'crystal'])
  insulatorType?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['full', 'half', 'piece', 'shield', 'external'])
  insulatorCoverage?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['external', 'internal', 'seats', 'piece', 'water_polish'])
  polishType?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['1', '2', '3'])
  polishSubType?: string;

  @IsString()
  @IsOptional()
  @IsEnum([
    'detailed_wash',
    'premium_wash',
    'leather_pedals',
    'blackout',
    'nano_interior_decor',
    'nano_interior_seats',
  ])
  additionType?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['full', 'external_only', 'internal_only', 'engine'])
  washScope?: string;

  @IsNumber()
  @IsOptional()
  servicePrice?: number;

  
  @IsString()
  @IsOptional()
  protectionColor?: number;

  
  @IsString()
  @IsOptional()
  originalCarColor?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  serviceDate?: Date;

  @ValidateNested()
  @Type(() => GuaranteeDto)
  @IsOptional()
  guarantee?: GuaranteeDto;
}