// invoice.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Client' })
  clientId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Orders' })
  orderId: Types.ObjectId;

  @Prop({ required: true, type: String })
  invoiceNumber: string;

  @Prop({ required: true, type: Date })
  issueDate: Date;

  @Prop({ required: true, type: String })
  phone: string;

  @Prop({ required: true, type: String })
  carType: string;

  @Prop({ required: true, type: String })
  carModel: string;

  @Prop({ required: true, type: String })
  carPlateNumber: string;

  @Prop({
    type: [
      {
        serviceType: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    required: true,
  })
  services: Array<{
    serviceType: string;
    description: string;
    price: number;
  }>;

  @Prop({ required: true, type: Number })
  subtotal: number;

  @Prop({ required: true, type: Number, default: 0.05 }) // 5% ضريبة
  taxRate: number;

  @Prop({ required: true, type: Number })
  taxAmount: number;

  @Prop({ required: true, type: Number })
  totalAmount: number;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);