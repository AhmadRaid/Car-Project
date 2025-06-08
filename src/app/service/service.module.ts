import { Module } from '@nestjs/common';
import { ServicesController } from './service.controller';
import { ServicesService } from './service.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from 'src/schemas/service.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
      imports: [
        MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
        AuthModule,
      ],
  controllers: [ServicesController],
  providers: [ServicesService]
})
export class ServiceModule {}
