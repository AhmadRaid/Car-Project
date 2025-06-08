import { 
  IsString, 
  IsNotEmpty, 
  IsNumber, 
  Min, 
  Max,
  IsBoolean,
  IsOptional
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

}

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

}