import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Address } from 'cluster';
import { Types } from 'mongoose';
import { userRoles } from 'src/common/enum/userRoles.enum';
import { userStatus } from 'src/common/enum/userStatus.enum';

export type UserDocument = User & Document & { _id: Types.ObjectId };

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ required: true, type: String })
  fullName: string;

  @Prop({ required: true, type: String })
  employeeId: string;

  @Prop({  type: String })
  email: string;

  @Prop({ required: true, type: String })
  password: string;

  @Prop({ type: String })
  image: string;

  @Prop({ type: String })
  phoneNumber: string;

  @Prop({ required: true, type: String, enum: userRoles })
  role: string;

  @Prop({ required: true, type: String })
  branch: string;

  @Prop({ type: String, default: 'active', enum: userStatus })
  status: string;

  @Prop({ type: String, default: null })
  resetPasswordToken: string | null;

  @Prop({ type: Date, default: null })
  resetPasswordExpires: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'Address' })
  address: Address;

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  favorites: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  recentlyViewed: Types.ObjectId[];

  @Prop({ type: Boolean, default: true })
  isNewUser: boolean;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
