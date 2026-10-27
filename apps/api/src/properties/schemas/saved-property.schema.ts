import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SavedPropertyDocument = HydratedDocument<SavedProperty>;

@Schema({ timestamps: true, collection: 'saved_properties' })
export class SavedProperty {
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true, index: true }) propertyId!: string;
}
export const SavedPropertySchema = SchemaFactory.createForClass(SavedProperty);
SavedPropertySchema.index({ userId: 1, propertyId: 1 }, { unique: true });
