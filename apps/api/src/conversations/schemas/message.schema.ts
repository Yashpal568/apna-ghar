import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true }) conversationId!: Types.ObjectId;
  @Prop({ required: true, trim: true, index: true }) senderId!: string;
  @Prop({ required: true, trim: true, maxlength: 4000 }) text!: string;
  @Prop({ type: Date, required: true, index: true }) sentAt!: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversationId: 1, sentAt: -1, _id: -1 });
