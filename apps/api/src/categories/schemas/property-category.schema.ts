import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type PropertyCategoryDocument = HydratedDocument<PropertyCategory>;
@Schema({ timestamps: true, collection: 'property_categories' })
export class PropertyCategory {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true, maxlength: 50 }) key!: string;
  @Prop({ required: true, trim: true, maxlength: 100 }) label!: string;
  @Prop({ required: true, trim: true, maxlength: 8, default: '⌂' }) icon!: string;
  @Prop({ default: true, index: true }) active!: boolean;
  @Prop({ default: 0, min: 0 }) sortOrder!: number;
}
export const PropertyCategorySchema = SchemaFactory.createForClass(PropertyCategory);
PropertyCategorySchema.index({ active: 1, sortOrder: 1, label: 1 });
