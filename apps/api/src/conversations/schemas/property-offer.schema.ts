import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PropertyOfferDocument = HydratedDocument<PropertyOffer>;

export type PropertyOfferStatus = 'pending' | 'countered' | 'accepted' | 'rejected' | 'withdrawn';

@Schema({ timestamps: true, collection: 'property_offers' })
export class PropertyOffer {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true }) conversationId!: Types.ObjectId;
  @Prop({ required: true, index: true }) propertyId!: string;
  @Prop({ required: true, index: true }) buyerId!: string;
  @Prop({ required: true, index: true }) ownerId!: string;
  @Prop({ required: true, index: true }) senderId!: string;
  @Prop({ required: true, index: true }) recipientId!: string;
  @Prop({ required: true, min: 1, max: 1000000000000 }) amount!: number;
  @Prop({ required: true, min: 1 }) askingPriceAtOffer!: number;
  @Prop({ trim: true, maxlength: 1000 }) message?: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PropertyOffer', default: null }) previousOfferId?: Types.ObjectId | null;
  @Prop({ required: true, enum: ['pending', 'countered', 'accepted', 'rejected', 'withdrawn'], default: 'pending', index: true }) status!: PropertyOfferStatus;
  @Prop({ type: Date, default: null }) respondedAt?: Date | null;
}

export const PropertyOfferSchema = SchemaFactory.createForClass(PropertyOffer);
PropertyOfferSchema.index({ conversationId: 1, createdAt: 1 });
PropertyOfferSchema.index({ recipientId: 1, status: 1, createdAt: -1 });
