import { Module } from '@nestjs/common';
import { CarTypeService } from './type-cars.service';
import { CarTypeController } from './type-cars.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CarType, CarTypeSchema } from 'src/schemas/carTypes.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
      imports: [
        MongooseModule.forFeature([{ name: CarType.name, schema: CarTypeSchema }]),
        AuthModule,
      ],
  controllers: [CarTypeController],
  providers: [CarTypeService]
})
export class TypeCarsModule {}
