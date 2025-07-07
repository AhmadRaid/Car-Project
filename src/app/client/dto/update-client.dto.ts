import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  Min, 
  Max, 
  MaxLength,
  IsEnum,
  IsBoolean,
  IsPhoneNumber,
  IsEmail,
  Matches
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  middleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^05\d{8}$/, {
    message: 'يجب أن يبدأ رقم الهاتف بـ 05 ويتكون من 10 أرقام',
  })
  phone?: string;

  @IsOptional()
  @IsEnum(['individual', 'company'])
  clientType?: string;

  @IsOptional()
  @IsEnum(['عملاء فرع ابحر', 'عملاء فرع المدينة', 'اخرى'])
  branch?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Transform(({ value }) => value ? Math.round(value) : null)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  notes?: string;
}