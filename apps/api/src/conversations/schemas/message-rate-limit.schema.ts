import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'message_rate_limits', timestamps: false })
export class MessageRateLimit {
  @Prop({ required: true, type: String }) _id!: string;
  @Prop({ required: true, type: Date }) windowStartedAt!: Date;
  @Prop({ required: true, type: Number, default: 0 }) count!: number;
  @Prop({ required: true, type: Date }) expiresAt!: Date;
}
export const MessageRateLimitSchema = SchemaFactory.createForClass(MessageRateLimit);
MessageRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
