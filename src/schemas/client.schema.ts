import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ClientType } from 'src/common/enum/clientType.enum';

export type ClientDocument = Client & Document;

@Schema({
  timestamps: true,
})
export class Client {
  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String, required: true })
  middleName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: String, enum: ClientType })
  clientType: ClientType;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: [Types.ObjectId], ref: 'Order', default: [] })
  orderIds: Types.ObjectId[];

  @Prop({ type: String })
  company: string;

  @Prop({
    type: String,
    enum: ['عملاء فرع ابحر', 'عملاء فرع المدينة', 'اخرى'],
    required: true,
  })
  branch: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const ClientSchema = SchemaFactory.createForClass(Client);

// // Add virtuals to ensure they're included when converting to JSON
// ClientSchema.set('toJSON', { virtuals: true });
// ClientSchema.set('toObject', { virtuals: true });
