import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Client, ClientSchema } from 'src/schemas/client.schema';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
    imports: [
      MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }]),
      AuthModule,
      OrdersModule
    ],
  controllers: [ClientController],
  providers: [ClientService]
})
export class ClientModule {}
