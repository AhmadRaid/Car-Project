import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({
  timestamps: true,
})
export class Reports {
  @Prop({ type: String, ref: 'User', required: true })
  employeeId: string;

  @Prop({ type: String, required: false })
  title?: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const ReportSchema = SchemaFactory.createForClass(Reports);