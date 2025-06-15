import { IsEnum, IsNotEmpty, IsOptional, IsString, IsEmail, IsPhoneNumber, IsBoolean } from 'class-validator';
import { ClientType } from 'src/common/enum/clientType.enum';

export class CreateClientDto {
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

  @IsEnum(ClientType)
  clientType: ClientType;

  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber(null)
  phone: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['عملاء فرع ابحر', 'عملاء فرع المدينة', 'اخرى'])
  branch: string;

  @IsString()
  @IsOptional()
  address?: string;

}