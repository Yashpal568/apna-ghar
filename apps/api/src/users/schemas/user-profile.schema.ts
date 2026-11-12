import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserProfileDocument = HydratedDocument<UserProfile>;

export enum UserRole {
  USER = 'USER',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

export type AccountStatus = 'active' | 'suspended' | 'deactivated';

@Schema({ timestamps: true, collection: 'user_profiles' })
export class UserProfile {
  @Prop({ required: true, unique: true, index: true, trim: true })
  clerkUserId!: string;

  @Prop({ trim: true, maxlength: 100, default: '' })
  name!: string;

  @Prop({ trim: true, lowercase: true, maxlength: 254, default: '' })
  email!: string;

  @Prop({ trim: true, maxlength: 30, default: '' })
  phone!: string;

  @Prop({ trim: true, maxlength: 100, default: '' })
  city!: string;

  @Prop({ trim: true, maxlength: 500, default: '' })
  about!: string;

  @Prop({ trim: true, maxlength: 2048, default: '' })
  imageUrl!: string;

  @Prop({ required: true, enum: ['USER', 'OWNER', 'ADMIN'], default: UserRole.USER, index: true })
  role!: UserRole;

  @Prop({ required: true, enum: ['active', 'suspended', 'deactivated'], default: 'active', index: true })
  accountStatus!: AccountStatus;

  @Prop({ type: Date, default: Date.now })
  lastActiveAt!: Date;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
UserProfileSchema.index({ role: 1, accountStatus: 1 });
UserProfileSchema.index({ email: 1 });
