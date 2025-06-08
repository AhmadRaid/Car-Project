import { Module } from '@nestjs/common';
import { ServicesController } from './service.controller';
import { ServicesService } from './service.service';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService]
})
export class ServiceModule {}
