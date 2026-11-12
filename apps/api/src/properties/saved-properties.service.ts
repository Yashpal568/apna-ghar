import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SavedProperty, SavedPropertyDocument } from './schemas/saved-property.schema';
import { Property, PropertyDocument } from './schemas/property.schema';

@Injectable()
export class SavedPropertiesService {
  constructor(
    @InjectModel(SavedProperty.name) private readonly saved: Model<SavedPropertyDocument>,
    @InjectModel(Property.name) private readonly properties: Model<PropertyDocument>,
  ) {}

  async list(userId: string) {
    const saved = await this.saved.find({ userId }).sort({ createdAt: -1 }).lean().exec();
    if (!saved.length) return [];
    const ids = saved.map((item) => item.propertyId);
    const homes = await this.properties.find({ _id: { $in: ids }, status: 'active', deletedAt: null }).select('-__v').lean().exec();
    const order = new Map(ids.map((id, index) => [id, index]));
    return homes.sort((a, b) => (order.get(String(a._id)) ?? 0) - (order.get(String(b._id)) ?? 0));
  }

  async add(userId: string, propertyId: string) {
    const mongoose = await import('mongoose');
    if (!mongoose.isValidObjectId(propertyId)) return null;
    const property = await this.properties.findOne({ _id: propertyId, status: 'active', deletedAt: null }).select('_id').lean().exec();
    if (!property) return null;
    await this.saved.updateOne({ userId, propertyId }, { $setOnInsert: { userId, propertyId } }, { upsert: true }).exec();
    return { saved: true, propertyId };
  }

  async remove(userId: string, propertyId: string) {
    await this.saved.deleteOne({ userId, propertyId }).exec();
    return { saved: false, propertyId };
  }

  async sync(userId: string, propertyIds: string[]) {
    const mongoose = await import('mongoose');
    const validIds = (propertyIds || []).filter((id) => mongoose.isValidObjectId(id));
    if (!validIds.length) return { savedIds: [], count: 0 };

    const activeProperties = await this.properties
      .find({ _id: { $in: validIds }, status: 'active', deletedAt: null })
      .select('_id')
      .lean()
      .exec();

    const activeIdStrings = activeProperties.map((p) => String(p._id));
    if (!activeIdStrings.length) return { savedIds: [], count: 0 };

    const ops = activeIdStrings.map((propertyId) => ({
      updateOne: {
        filter: { userId, propertyId },
        update: { $setOnInsert: { userId, propertyId } },
        upsert: true,
      },
    }));

    await this.saved.bulkWrite(ops);
    return { savedIds: activeIdStrings, count: activeIdStrings.length };
  }

  async isSaved(userId: string, propertyId: string): Promise<boolean> {
    const mongoose = await import('mongoose');
    if (!mongoose.isValidObjectId(propertyId)) return false;
    const record = await this.saved.findOne({ userId, propertyId }).select('_id').lean().exec();
    return Boolean(record);
  }
}
