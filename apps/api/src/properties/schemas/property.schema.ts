import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PropertyDocument = HydratedDocument<Property>;

@Schema({ _id: false })
export class PropertyLocation {
  @Prop({ required: true, trim: true }) state!: string;
  @Prop({ required: true, trim: true, index: true }) city!: string;
  @Prop({ trim: true, default: '' }) locality!: string;
  @Prop({ trim: true, default: '' }) addressText!: string;
}
export const PropertyLocationSchema = SchemaFactory.createForClass(PropertyLocation);

@Schema({ timestamps: true, collection: 'properties' })
export class Property {
  @Prop({ required: true, trim: true, index: true }) ownerId!: string;
  @Prop({ required: true, trim: true, maxlength: 140 }) title!: string;
  @Prop({ required: true, unique: true, trim: true, lowercase: true, index: true }) slug!: string;
  @Prop({ required: true, trim: true, maxlength: 5000 }) description!: string;
  @Prop({ required: true, trim: true, index: true }) categoryId!: string;
  @Prop({ required: true, enum: ['sale', 'rent'], index: true }) listingType!: 'sale' | 'rent';
  @Prop({ required: true, min: 0, index: true }) priceAmount!: number;
  @Prop({ default: 'INR', enum: ['INR'] }) currency!: string;
  @Prop({ type: PropertyLocationSchema, required: true }) location!: PropertyLocation;
  @Prop({ required: true, min: 1 }) areaValue!: number;
  @Prop({ required: true, enum: ['sqft', 'sqm', 'acre'] }) areaUnit!: 'sqft' | 'sqm' | 'acre';
  @Prop({ min: 0, default: 0 }) bedrooms!: number;
  @Prop({ min: 0, default: 0 }) bathrooms!: number;
  @Prop({ min: 0, default: 0 }) parkingCount!: number;
  @Prop({ default: 'unknown', enum: ['unfurnished', 'semi-furnished', 'furnished', 'unknown'] }) furnishing!: string;
  @Prop({ type: [String], default: [] }) amenities!: string[];
  @Prop({ default: false }) isNegotiable!: boolean;
  @Prop({ type: [String], default: [] }) imageUrls!: string[];
  @Prop({ required: true, enum: ['active', 'hidden_by_owner', 'removed_by_admin', 'deleted'], default: 'active', index: true }) status!: string;
  @Prop({ default: 0, min: 0 }) viewsCount!: number;
  @Prop({ type: Date, default: Date.now, index: true }) publishedAt!: Date;
  @Prop({ type: Date, default: null }) deletedAt!: Date | null;
}
export const PropertySchema = SchemaFactory.createForClass(Property);
PropertySchema.index({ status: 1, publishedAt: -1 });
PropertySchema.index({ categoryId: 1, status: 1, publishedAt: -1 });
PropertySchema.index({ 'location.city': 1, status: 1, publishedAt: -1 });
PropertySchema.index({ priceAmount: 1, status: 1 });
