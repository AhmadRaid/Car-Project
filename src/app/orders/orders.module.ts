import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Orders, OrdersSchema } from 'src/schemas/orders.schema';
import { InvoiceModule } from '../invoice/invoice.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Orders.name, schema: OrdersSchema }]),
    AuthModule,
    InvoiceModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [MongooseModule] // Add this line to export the model
})
export class OrdersModule {}
