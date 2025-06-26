import { IsBoolean, IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginAuthDto {

  @IsString()
  @IsNotEmpty()
  readonly employeeId: string;

  @IsNotEmpty()
  @MinLength(6)
  readonly password: string;
  
  @IsNotEmpty()
  readonly branch: string;
}
