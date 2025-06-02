import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrdersDocument = Orders & Document;

@Schema({ timestamps: true })
export class Orders {
  @Prop({ required: true, type: String, ref: 'Client' })
  clientId: string;

  @Prop({ required: true, type: String })
  carModel: string;

  @Prop({ required: true, type: String })
  carColor: string;

  @Prop({ required: true, type: String })
  service: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Order' }], default: [] })
  orderIds: Types.ObjectId[];
  
  @Prop({
    type: {
      products: { type: [String], required: true },
      type: { 
        type: String, 
        required: true,
        enum: ['قلم حراري','عوازل حرارية']
      },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      terms: { type: String },
      coveredComponents: { type: [String] }
    },
  })
  guarantee: {
    products: string[];
    type: string;
    startDate: Date;
    endDate: Date;
    terms?: string;
    coveredComponents?: string[];
  };

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  // Virtual for guarantee duration in days
  @Prop({
    virtual: true,
    get: function() {
      const diffTime = Math.abs(
        this.guarantee.endDate.getTime() - this.guarantee.startDate.getTime()
      );
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  })
  guaranteeDurationDays: number;
}

export const OrdersSchema = SchemaFactory.createForClass(Orders);

// Ensure virtuals are included when converting to JSON
OrdersSchema.set('toJSON', { virtuals: true });
OrdersSchema.set('toObject', { virtuals: true });