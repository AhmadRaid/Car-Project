// import { PartialType } from '@nestjs/mapped-types';
// import { CreateOrderDto } from './create-order.dto';
// import { IsDateString, IsIn, IsOptional } from 'class-validator';

// export class UpdateOrderDto extends PartialType(CreateOrderDto) {
//   @IsOptional()
//  // @IsIn(Object.values(GuaranteeType))
//   guarantee?: {
//     products?: string[];
//     type?: string;
//     @IsDateString()
//     startDate?: Date;
//     @IsDateString()
//     endDate?: Date;
//     terms?: string;
//     coveredComponents?: string[];
//   };
// }