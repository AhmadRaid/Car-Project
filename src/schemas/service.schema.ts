import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Service extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;


  @Prop({ default: false })
  isDeleted: boolean;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);