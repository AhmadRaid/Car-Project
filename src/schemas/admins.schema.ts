import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AdminStatus } from 'src/common/enum/adminStatus.enum';
import { userRoles } from 'src/common/enum/userRoles.enum';

@Schema({
  timestamps: true,
})
export class Admin {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String, unique: true })
  email: string;

  @Prop({ required: true, type: String })
  password: string;

  @Prop({ required: true, type: String, enum: userRoles})
  role: userRoles;

  @Prop({ type: String, default: 'active', enum: AdminStatus })
  status: string;

  @Prop({ type: String, default: null })
  resetPasswordToken: string | null;

  @Prop({ type: Date, default: null })
  resetPasswordExpires: Date | null;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
