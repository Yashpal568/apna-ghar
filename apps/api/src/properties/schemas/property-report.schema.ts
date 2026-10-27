import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PropertyReportDocument = HydratedDocument<PropertyReport>;

@Schema({ timestamps: true, collection: 'property_reports' })
export class PropertyReport {
  @Prop({ required: true, index: true }) reporterId!: string;
  @Prop({ required: true, index: true }) propertyId!: string;
  @Prop({ required: true, enum: ['misleading', 'duplicate', 'scam', 'wrong_information', 'inappropriate', 'other'] }) reason!: string;
  @Prop({ trim: true, maxlength: 1500, default: '' }) details!: string;
  @Prop({ required: true, enum: ['open', 'reviewing', 'resolved', 'dismissed'], default: 'open', index: true }) status!: string;
}
export const PropertyReportSchema = SchemaFactory.createForClass(PropertyReport);
PropertyReportSchema.index({ reporterId: 1, propertyId: 1, status: 1 });
