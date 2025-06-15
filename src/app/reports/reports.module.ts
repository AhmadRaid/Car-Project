import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import {  Reports, ReportSchema } from 'src/schemas/reports.schema';

@Module({
    imports: [
      MongooseModule.forFeature([{ name: Reports.name, schema: ReportSchema }]),
      AuthModule,
    ],
  controllers: [ReportsController],
  providers: [ReportsService]
})
export class ReportsModule {}
