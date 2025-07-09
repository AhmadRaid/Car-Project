import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Client, ClientSchema } from 'src/schemas/client.schema';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { OrdersModule } from '../orders/orders.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { Orders, OrdersSchema } from 'src/schemas/orders.schema';
import { Invoice, InvoiceSchema } from 'src/schemas/invoice.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Orders.name, schema: OrdersSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    AuthModule,
    forwardRef(() => OrdersModule),
    forwardRef(() => InvoiceModule),
  ],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService, MongooseModule], // تأكد من تصدير الخدمة
})
export class ClientModule {}