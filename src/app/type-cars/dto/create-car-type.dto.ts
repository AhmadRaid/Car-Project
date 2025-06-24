import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { CarSize } from 'src/schemas/carTypes.schema';

export class CreateCarTypeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  manufacturer: string;

  @IsOptional()
  @IsEnum(CarSize)
  size: CarSize;

  @IsOptional()
  @IsNumber()
  @Min(0)
  averagePrice?: number;
}