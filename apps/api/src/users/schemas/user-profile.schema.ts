import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserProfileDocument = HydratedDocument<UserProfile>;

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
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
