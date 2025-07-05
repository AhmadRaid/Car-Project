import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrdersDocument = Orders & Document;

@Schema({ timestamps: true })
export class Orders {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Client' })
  clientId: Types.ObjectId;

  @Prop({ required: true, type: String })
  carType: string;

  @Prop({ required: true, type: String })
  carModel: string;

  @Prop({ required: true, type: String })
  carColor: string;

  @Prop({
    type: [String],
    required: true,
    validate: {
      validator: (plate: string[]) => plate.length === 8,
      message: 'Car plate must have exactly 8 characters',
    },
  })
  carPlateNumber: string[];

  @Prop({ type: String, required: true })
  carManufacturer: string;

  @Prop({ type: String, required: true })
  carSize: string;

  @Prop({
    type: [
      {
        _id: { type: Types.ObjectId, auto: true },
        serviceType: {
          type: String,
          required: true,
          enum: ['polish', 'protection', 'insulator', 'additions'],
        },
        dealDetails: { type: String },
        protectionFinish: {
          type: String,
          enum: ['glossy', 'matte', 'colored'],
        },
        protectionSize: { type: String, enum: ['10', '7.5'] },
        protectionCoverage: {
          type: String,
          enum: ['full', 'half', 'quarter', 'edges', 'other'],
        },
        insulatorType: { type: String, enum: ['ceramic', 'carbon', 'crystal'] },
        insulatorCoverage: {
          type: String,
          enum: ['full', 'half', 'piece', 'shield', 'external'],
        },
        polishType: {
          type: String,
          enum: ['external', 'internal', 'seats', 'piece', 'water_polish'],
        },
        polishSubType: { type: String, enum: ['1', '2', '3'] },
        additionType: {
          type: String,
          enum: [
            'detailed_wash',
            'premium_wash',
            'leather_pedals',
            'blackout',
            'nano_interior_decor',
            'nano_interior_seats',
          ],
        },
        washScope: {
          type: String,
          enum: ['full', 'external_only', 'internal_only', 'engine'],
        },
        servicePrice: { type: Number },
        serviceDate: { type: Date },
        guarantee: {
          type: {
            typeGuarantee: {
              type: String,
              required: true,
              enum: ['2 سنوات', '3 سنوات', '5 سنوات', '8 سنوات', '10 سنوات'],
            },
            startDate: { type: Date, required: true },
            endDate: { type: Date, required: true },
            terms: { type: String },
            notes: { type: String },
            status: {
              type: String,
              enum: ['active', 'inactive'],
              default: 'inactive',
            },
            accepted: { type: Boolean, default: false },
          },
          required: true,
        },
      },
    ],
    default: [],
  })
  services: Array<{
    _id: Types.ObjectId;
    serviceType: string;
    dealDetails?: string;
    protectionFinish?: string;
    protectionSize?: string;
    protectionCoverage?: string;
    insulatorType?: string;
    insulatorCoverage?: string;
    polishType?: string;
    polishSubType?: string;
    additionType?: string;
    washScope?: string;
    servicePrice?: number;
    serviceDate?: Date;
    guarantee: {
      typeGuarantee: string;
      startDate: Date;
      endDate: Date;
      terms?: string;
      notes?: string;
      status?: string;
      accepted: boolean;
    };
  }>;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const OrdersSchema = SchemaFactory.createForClass(Orders);
