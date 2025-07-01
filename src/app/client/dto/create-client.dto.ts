import { 
  IsString, IsOptional, IsEmail, IsEnum, IsArray, 
  ValidateNested, IsDate, IsNumber, IsNotEmpty 
} from 'class-validator';
import { Type } from 'class-transformer';

export class GuaranteeDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['2 سنوات', '3 سنوات', '5 سنوات', '8 سنوات', '10 سنوات'])
  typeGuarantee: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

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
  @IsEnum(['10', '7.5'])
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
    'nano_interior_seats'
  ])
  additionType?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['full', 'external_only', 'internal_only', 'engine'])
  washScope?: string;

  @IsNumber()
  @IsOptional()
  servicePrice?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  serviceDate?: Date;

  @ValidateNested()
  @Type(() => GuaranteeDto)
  guarantee: GuaranteeDto;
}

export class createClientAndOrderDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  middleName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsEnum(['individual', 'company'])
  clientType: string;

  @IsString()
  @IsNotEmpty()
  branch: string;

  @IsString()
  @IsNotEmpty()
  carType: string;

  @IsString()
  @IsNotEmpty()
  carModel: string;

  @IsString()
  @IsNotEmpty()
  carColor: string;

  @IsString()
  @IsNotEmpty()
  carPlateNumber: string;

  @IsString()
  @IsNotEmpty()
  carManufacturer: string;

  @IsString()
  @IsNotEmpty()
  carSize: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services: ServiceDto[];
}