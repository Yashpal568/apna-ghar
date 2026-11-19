import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type UploadedAttachmentDocument = HydratedDocument<UploadedAttachment>;

@Schema({ timestamps: true, collection: 'uploaded_attachments' })
export class UploadedAttachment {
  @Prop({ required: true, index: true }) uploaderId!: string;
  @Prop({ required: true, trim: true }) filename!: string;
  @Prop({ required: true, trim: true }) contentType!: string;
  @Prop({ required: true }) sizeBytes!: number;
  @Prop({ required: false, trim: true }) publicId?: string;
  @Prop({ required: false, trim: true }) storageUrl?: string;
  @Prop({ required: false }) dataBuffer?: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, required: false, index: true }) conversationId?: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, required: false, index: true }) messageId?: Types.ObjectId;
  @Prop({ default: false, index: true }) claimed!: boolean;
  @Prop({ type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), index: { expires: 0 } }) expiresAt!: Date;
}

export const UploadedAttachmentSchema = SchemaFactory.createForClass(UploadedAttachment);
UploadedAttachmentSchema.index({ uploaderId: 1, createdAt: -1 });
