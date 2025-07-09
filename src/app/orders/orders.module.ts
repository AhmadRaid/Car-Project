import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Orders, OrdersSchema } from 'src/schemas/orders.schema';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ClientModule } from '../client/client.module';
import { InvoiceModule } from '../invoice/invoice.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Orders.name, schema: OrdersSchema }]),
    forwardRef(() => ClientModule),
    forwardRef(() => InvoiceModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService, MongooseModule], // تأكد من تصدير الخدمة والنموذج
})
export class OrdersModule {}