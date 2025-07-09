import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';

export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({
    type: String,
    unique: true,
    default: 'INV-1001'
  })
  invoiceNumber: string;

  @Prop({ type: Date, default: Date.now })
  invoiceDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Orders', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  subtotal: number;

  @Prop({ type: Number, default: 15 }) // 15% ضريبة
  taxRate: number;

  @Prop({ type: Number, required: true })
  taxAmount: number;

  @Prop({ type: Number, required: true })
  totalAmount: number;

  @Prop({ type: String })
  notes: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

InvoiceSchema.pre<InvoiceDocument>('save', async function(next) {
  if (!this.isNew || this.invoiceNumber !== 'INV-1001') {
    return next();
  }
  
  const model = this.constructor as Model<InvoiceDocument>;
  const lastInvoice = await model.findOne({}, {}, { sort: { invoiceNumber: -1 } });
  
  if (lastInvoice && lastInvoice.invoiceNumber) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.replace('INV-', ''), 10);
    this.invoiceNumber = `INV-${lastNumber + 1}`;
  } else {
    this.invoiceNumber = 'INV-1001';
  }
  
  next();
});