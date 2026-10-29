import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ _id: true, timestamps: true })
export class ConversationMessage {
  @Prop({ required: true, trim: true }) senderId!: string;
  @Prop({ required: true, trim: true, maxlength: 4000 }) text!: string;
  @Prop({ type: Date, default: Date.now }) sentAt!: Date;
}
export const ConversationMessageSchema = SchemaFactory.createForClass(ConversationMessage);

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop({ required: true, index: true }) propertyId!: string;
  @Prop({ required: true, trim: true }) propertyTitle!: string;
  @Prop({ required: true, trim: true }) propertySlug!: string;
  @Prop({ required: true, index: true }) ownerId!: string;
  @Prop({ required: true, index: true }) buyerId!: string;
  @Prop({ type: [String], required: true, index: true }) participantIds!: string[];
  @Prop({ type: [ConversationMessageSchema], default: [] }) messages!: ConversationMessage[];
  @Prop({ type: Date, default: Date.now }) lastMessageAt!: Date;
}
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ participantIds: 1, lastMessageAt: -1 });
ConversationSchema.index({ propertyId: 1, buyerId: 1 }, { unique: true });
