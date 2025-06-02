// import { IsNotEmpty, IsArray, IsDateString, IsIn } from 'class-validator';

// export class CreateOrderDto {
//   @IsNotEmpty()
//   clientId: string;

//   @IsNotEmpty()
//   modelCar: string;

//   @IsNotEmpty()
//   colorCar: string;

//   @IsNotEmpty()
//   service: string;

//   @IsNotEmpty()
//   guarantee: {
//     products: string[];
//   //  @IsIn(Object.values(GuaranteeType))
//     type: string;
//     @IsDateString()
//     startDate: Date;
//     @IsDateString()
//     endDate: Date;
//     terms?: string;
//     coveredComponents?: string[];
//   };
// }