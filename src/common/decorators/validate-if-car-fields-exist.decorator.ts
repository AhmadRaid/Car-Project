// src/clients/dto/validate-car-with-services.decorator.ts
import { 
  registerDecorator, 
  ValidationOptions, 
  ValidatorConstraint, 
  ValidatorConstraintInterface, 
  ValidationArguments 
} from 'class-validator';

@ValidatorConstraint({ name: 'validateCarWithServices' })
export class ValidateCarWithServicesConstraint implements ValidatorConstraintInterface {
  validate(services: any) {
    console.log('VALIDATOR IS RUNNING!'); // This should appear in logs
    return Array.isArray(services) && services.length > 0;
  }

  defaultMessage() {
    return 'Services array must not be empty when car information is provided';
  }
}

export function ValidateCarWithServices(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidateCarWithServicesConstraint,
    });
  };
}