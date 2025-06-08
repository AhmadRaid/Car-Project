import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrdersDocument = Orders & Document;

@Schema({ timestamps: true })
export class Orders {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Client' })
  clientId: Types.ObjectId;

  @Prop({ required: true, type: String })
  carModel: string;

  @Prop({ required: true, type: String })
  carColor: string;

  @Prop({ required: true, type: String })
  service: string;

  @Prop({
    type: [
      {
        typeGuarantee: {
          type: String,
          required: true,
        },
        startDate: { type: Date },
        endDate: { type: Date },
        terms: { type: String },
        status: {
          type: String,
          enum: ['active', 'inactive'],
          default: 'active',
        },
        coveredComponents: { type: [String] },
      },
    ],
  })
  guarantee: [
    {
      products: string;
      typeGuarantee: string;
      startDate: Date;
      endDate: Date;
      terms?: string;
      status?: string;
      coveredComponents?: string[];
    },
  ];

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  // Virtual for guarantee duration in days
  @Prop({
    virtual: true,
    get: function () {
      const diffTime = Math.abs(
        this.guarantee.endDate.getTime() - this.guarantee.startDate.getTime(),
      );
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
  })
  guaranteeDurationDays: number;
}

export const OrdersSchema = SchemaFactory.createForClass(Orders);

// Ensure virtuals are included when converting to JSON
OrdersSchema.set('toJSON', { virtuals: true });
OrdersSchema.set('toObject', { virtuals: true });
