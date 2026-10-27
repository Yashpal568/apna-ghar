import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VisitRequestDocument = HydratedDocument<VisitRequest>;

@Schema({ timestamps: true, collection: 'visit_requests' })
export class VisitRequest {
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true, index: true }) propertyId!: string;
  @Prop({ required: true, trim: true, maxlength: 10 }) preferredDate!: string;
  @Prop({ required: true, trim: true, maxlength: 20 }) preferredTime!: string;
  @Prop({ trim: true, maxlength: 1000, default: '' }) message!: string;
  @Prop({ required: true, enum: ['requested', 'confirmed', 'declined', 'cancelled'], default: 'requested', index: true }) status!: string;
}
export const VisitRequestSchema = SchemaFactory.createForClass(VisitRequest);
VisitRequestSchema.index({ userId: 1, propertyId: 1, preferredDate: 1, preferredTime: 1 });
