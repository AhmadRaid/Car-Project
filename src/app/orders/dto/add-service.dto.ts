import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// أنواع الخدمات المتاحة
export enum ServiceType {
  POLISH = 'polish',
  PROTECTION = 'protection',
  INSULATOR = 'insulator',
  ADDITIONS = 'additions',
}

// أنواع اللمعان للحماية
export enum ProtectionFinish {
  GLOSSY = 'glossy',
  MATTE = 'matte',
  COLORED = 'colored',
}

// أنواع العوازل
export enum InsulatorType {
  CERAMIC = 'ceramic',
  CARBON = 'carbon',
  CRYSTAL = 'crystal',
}

// أنواع التلميع
export enum PolishType {
  EXTERNAL = 'external',
  INTERNAL = 'internal',
  SEATS = 'seats',
  PIECE = 'piece',
  WATER_POLISH = 'water_polish',
}

// أنواع الإضافات
export enum AdditionType {
  DETAILED_WASH = 'detailed_wash',
  PREMIUM_WASH = 'premium_wash',
  LEATHER_PEDALS = 'leather_pedals',
  BLACKOUT = 'blackout',
  NANO_INTERIOR_DECOR = 'nano_interior_decor',
  NANO_INTERIOR_SEATS = 'nano_interior_seats',
}

// DTO للضمان
export class GuaranteeDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['2 سنوات', '3 سنوات', '5 سنوات', '8 سنوات', '10 سنوات'])
  typeGuarantee: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @IsDateString()
  @IsNotEmpty()
  endDate: Date;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// DTO للخدمة الأساسي
export class ServiceDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsString()
  @IsOptional()
  dealDetails?: string;

  @IsNumber()
  @IsOptional()
  servicePrice?: number;

  // حقول خاصة بخدمة الحماية
  @IsString()
  @IsOptional()
  originalCarColor?: string;

  @IsString()
  @IsOptional()
  protectionColor?: string;

  @IsString()
  @IsOptional()
  @IsEnum(ProtectionFinish)
  protectionFinish?: ProtectionFinish;

  @IsString()
  @IsOptional()
  protectionSize?: string;

  @IsString()
  @IsOptional()
  protectionCoverage?: string;

  // حقول خاصة بخدمة العازل الحراري
  @IsString()
  @IsOptional()
  @IsEnum(InsulatorType)
  insulatorType?: InsulatorType;

  @IsString()
  @IsOptional()
  insulatorCoverage?: string;

  // حقول خاصة بخدمة التلميع
  @IsString()
  @IsOptional()
  @IsEnum(PolishType)
  polishType?: PolishType;

  @IsString()
  @IsOptional()
  polishSubType?: string;

  // حقول خاصة بخدمة الإضافات
  @IsString()
  @IsOptional()
  @IsEnum(AdditionType)
  additionType?: AdditionType;

  @IsString()
  @IsOptional()
  washScope?: string;

  @ValidateNested()
  @Type(() => GuaranteeDto)
  guarantee: GuaranteeDto;
}

export class AddServicesToOrderDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsArray()
  @ArrayMinSize(1)
 // @ValidateNested({ each: true })
 // @Type(() => ServiceDto)
  services: ServiceDto[];
}
