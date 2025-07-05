// src/clients/dto/validate-car-with-services.decorator.ts
import { 
  registerDecorator, 
  ValidationOptions, 
  ValidatorConstraint, 
  ValidatorConstraintInterface, 
  ValidationArguments 
} from 'class-validator';

@ValidatorConstraint({ name: 'validateCarWithServices', async: false })
export class ValidateCarWithServicesConstraint implements ValidatorConstraintInterface {
  validate(services: any, args: ValidationArguments) {
    const dto = args.object as any;
    
    const hasCompleteCarInfo = dto.carType && 
                              dto.carModel && 
                              dto.carColor && 
                              dto.carPlateNumber && 
                              dto.carManufacturer && 
                              dto.carSize;
    
    if (!hasCompleteCarInfo) {
      return true;
    }
    
    if (services === undefined || services === null) {
      return false;
    }
    return Array.isArray(services) && services.length > 0;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Services are required when complete car information is provided';
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