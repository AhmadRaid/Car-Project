import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Model } from 'mongoose';
import { ClientType } from 'src/common/enum/clientType.enum';

export type ClientDocument = Client & Document;

@Schema({
  timestamps: true,
})
export class Client {
  @Prop({
    type: String,
    unique: true,
    default: 'CL-1001' 
  })
  clientNumber: string;

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

  @Prop({ type: String })
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

  @Prop({
    type: Number,
    enum: [1, 2, 3, 4, 5],
    default: null,
  })
  rating: number;

  @Prop({ type: String })
  notes: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const ClientSchema = SchemaFactory.createForClass(Client);

// Define the ClientModel type for type safety
type ClientModel = Model<ClientDocument>;

ClientSchema.pre<ClientDocument>('save', async function(next) {
  if (!this.isNew || this.clientNumber !== 'CL-1001') {
    return next();
  }
  
  const model = this.constructor as ClientModel;
  const lastClient = await model.findOne({}, {}, { sort: { clientNumber: -1 } });
  
  if (lastClient && lastClient.clientNumber) {
    const lastNumber = parseInt(lastClient.clientNumber.replace('CL-', ''), 10);
    this.clientNumber = `CL-${lastNumber + 1}`;
  } else {
    this.clientNumber = 'CL-1001';
  }
  
  next();
});