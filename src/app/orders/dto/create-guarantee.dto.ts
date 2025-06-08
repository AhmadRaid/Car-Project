import {
  IsArray,
  IsDate,
  IsIn,
  IsOptional,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  MinDate,
} from 'class-validator';
import { Transform } from 'class-transformer';

@ValidatorConstraint({ name: 'isAfter', async: false })
class IsAfterConstraint implements ValidatorConstraintInterface {
  validate(propertyValue: Date, args: ValidationArguments) {
    return propertyValue > args.object[args.constraints[0]];
  }

  defaultMessage(args: ValidationArguments) {
    return `"${args.property}" must be after "${args.constraints[0]}"`;
  }
}

export class AddGuaranteeDto {
  @IsString()
  products: string;

  @IsIn(['فلم حماية', 'عوازل حرارية'], {
    message: 'typeGuarantee must be either "فلم حماية" or "عوازل حرارية"',
  })
  typeGuarantee: string;

  @IsDate()
  @Transform(({ value }) => new Date(value)) // Ensure proper Date conversion
  @MinDate(new Date(), { message: 'Start date must be today or in the future' })
  startDate: Date;

  @IsDate()
  @Transform(({ value }) => new Date(value)) // Ensure proper Date conversion
  @Validate(IsAfterConstraint, ['startDate'])
  @MinDate(new Date(), { message: 'End date must be in the future' })
  endDate: Date;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsArray()
  @IsOptional()
  coveredComponents?: string[];
}
