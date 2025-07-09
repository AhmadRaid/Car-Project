import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsArray,
  IsNotEmpty,
  ValidateIf,
  ValidateNested,
  IsNotEmptyObject,
  IsNumber,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ServiceDto } from './service.dto';
import { Type } from 'class-transformer';

export class createClientAndOrderDto {
  // Client Information
  @IsString({ message: 'يجب أن يكون الاسم الأول نصًا' })
  @IsNotEmpty({ message: 'الاسم الأول مطلوب' })
  firstName: string;

  @IsString({ message: 'يجب أن يكون الاسم الأوسط نصًا' })
  @IsNotEmpty({ message: 'الاسم الأوسط مطلوب' })
  middleName: string;

  @IsString({ message: 'يجب أن يكون الاسم الأخير نصًا' })
  @IsNotEmpty({ message: 'الاسم الأخير مطلوب' })
  lastName: string;

  @IsEmail({}, { message: 'يجب أن يكون البريد الإلكتروني صالحًا' })
  @IsOptional()
  email?: string;

  @IsString()
  @Matches(/^05\d{8}$/, {
    message: 'يجب أن يبدأ رقم الهاتف بـ 05 ويتكون من 10 أرقام',
  })
  phone: string;

  @IsString({ message: 'يجب أن يكون نوع العميل نصًا' })
  @IsEnum(['individual', 'company'], {
    message: 'نوع العميل يجب أن يكون إما فردي (individual) أو شركة (company)',
  })
  clientType: string;

  @IsString({ message: 'يجب أن يكون الفرع نصًا' })
  @IsNotEmpty({ message: 'الفرع مطلوب' })
  branch: string;

  // Car Information (required if services are provided)
  @IsString({ message: 'يجب أن يكون نوع السيارة نصًا' })
  @ValidateIf((o) => o.services && o.services.length > 0)
  @IsNotEmpty({ message: 'نوع السيارة مطلوب عند إضافة خدمات' })
  carType?: string;

  @IsString({ message: 'يجب أن يكون موديل السيارة نصًا' })
  @ValidateIf((o) => o.services && o.services.length > 0)
  @IsNotEmpty({ message: 'موديل السيارة مطلوب عند إضافة خدمات' })
  carModel?: string;

  @IsString({ message: 'يجب أن يكون لون السيارة نصًا' })
  @ValidateIf((o) => o.services && o.services.length > 0)
  @IsNotEmpty({ message: 'لون السيارة مطلوب عند إضافة خدمات' })
  carColor?: string;

  @IsString({ message: 'يجب أن يكون رقم لوحة السيارة نص' })
  @ValidateIf((o) => o.services && o.services.length > 0)
  @IsNotEmpty({ message: 'رقم لوحة السيارة مطلوب عند إضافة خدمات' })
  carPlateNumber?: string;

  @IsString({ message: 'يجب أن يكون صانع السيارة نصًا' })
  @ValidateIf((o) => o.services && o.services.length > 0)
  @IsNotEmpty({ message: 'صانع السيارة مطلوب عند إضافة خدمات' })
  carManufacturer?: string;

  @IsString({ message: 'يجب أن يكون حجم السيارة نصًا' })
  @ValidateIf((o) => o.services && o.services.length > 0)
  @IsNotEmpty({ message: 'حجم السيارة مطلوب عند إضافة خدمات' })
  carSize?: string;

  @ValidateIf(
    (o) =>
      o.carType !== undefined &&
      o.carModel !== undefined &&
      o.carColor !== undefined &&
      o.carPlateNumber !== undefined &&
      o.carManufacturer !== undefined &&
      o.carSize !== undefined,
  )
  @IsArray({ message: 'الرجاء ارسال حقول كمصفوفة' })
  @IsOptional()
  services?: ServiceDto[];

  @IsOptional()
  invoiceNotes?: string;
}
