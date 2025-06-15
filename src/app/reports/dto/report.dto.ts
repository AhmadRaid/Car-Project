import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateReportDto {

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string; // Added title field for better organization
}
