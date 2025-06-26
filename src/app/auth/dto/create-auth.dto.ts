import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SignUpAuthDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  readonly fullName: string;

  @IsString()
  @IsNotEmpty()
  readonly employeeId: string;

  @IsNotEmpty()
  @MinLength(6)
  readonly password: string;

  @IsString()
  @IsNotEmpty()
  readonly role: string;

  @IsString()
  @IsNotEmpty()
  readonly branch: string;

  @IsOptional()
  @IsEmail()
  readonly email: string;
}
