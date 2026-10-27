import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder } from 'mongoose';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { Property, PropertyDocument } from './schemas/property.schema';

@Injectable()
export class PropertiesService {
  constructor(@InjectModel(Property.name) private readonly properties: Model<PropertyDocument>) {}

  async list(query: ListPropertiesQueryDto) {
    const filter: FilterQuery<PropertyDocument> = { status: 'active', deletedAt: null };
    if (query.city) filter['location.city'] = new RegExp(this.escapeRegex(query.city), 'i');
    if (query.locality) filter['location.locality'] = new RegExp(this.escapeRegex(query.locality), 'i');
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.listingType) filter.listingType = query.listingType;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.priceAmount = {};
      if (query.minPrice !== undefined) filter.priceAmount.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.priceAmount.$lte = query.maxPrice;
    }
    if (query.q) {
      const expression = new RegExp(this.escapeRegex(query.q), 'i');
      filter.$or = [{ title: expression }, { description: expression }, { 'location.city': expression }, { 'location.locality': expression }];
    }

    const sort: Record<string, SortOrder> = query.sort === 'price_asc' ? { priceAmount: 1 }
      : query.sort === 'price_desc' ? { priceAmount: -1 }
      : { publishedAt: -1 };
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await Promise.all([
      this.properties.find(filter).sort(sort).skip((page - 1) * limit).limit(limit)
        .select('-__v').lean().exec(),
      this.properties.countDocuments(filter).exec(),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async create(ownerId: string, dto: CreatePropertyDto) {
    const baseSlug = dto.title.toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || 'property';
    const slug = `${baseSlug}-${randomUUID().slice(0, 8)}`;
    const created = await this.properties.create({
      ...dto,
      ownerId,
      slug,
      status: 'active',
      publishedAt: new Date(),
      deletedAt: null,
    });
    return created.toObject();
  }

  async listMine(ownerId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const filter: FilterQuery<PropertyDocument> = { ownerId, deletedAt: null, status: { $ne: 'deleted' } };
    const [items, total] = await Promise.all([
      this.properties.find(filter).sort({ updatedAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).select('-__v').lean().exec(),
      this.properties.countDocuments(filter).exec(),
    ]);
    return { items, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
  }

  async updateMine(ownerId: string, id: string, dto: UpdatePropertyDto) {
    const updated = await this.properties.findOneAndUpdate(
      { _id: id, ownerId, deletedAt: null, status: { $ne: 'deleted' } },
      { $set: dto },
      { new: true, runValidators: true },
    ).select('-__v').lean().exec();
    if (!updated) throw new NotFoundException('Property not found');
    return updated;
  }

  async hideMine(ownerId: string, id: string) {
    const updated = await this.properties.findOneAndUpdate(
      { _id: id, ownerId, deletedAt: null, status: { $ne: 'deleted' } },
      { $set: { status: 'hidden_by_owner' } },
      { new: true },
    ).select('-__v').lean().exec();
    if (!updated) throw new NotFoundException('Property not found');
    return updated;
  }

  async deleteMine(ownerId: string, id: string) {
    const updated = await this.properties.findOneAndUpdate(
      { _id: id, ownerId, deletedAt: null, status: { $ne: 'deleted' } },
      { $set: { status: 'deleted', deletedAt: new Date() } },
      { new: true },
    ).select('_id status deletedAt').lean().exec();
    if (!updated) throw new NotFoundException('Property not found');
    return { success: true, property: updated };
  }

  async findPublicBySlugOrId(identifier: string) {
    const mongoose = await import('mongoose');
    const filter: FilterQuery<PropertyDocument> = { status: 'active', deletedAt: null };
    if (mongoose.isValidObjectId(identifier)) {
      filter.$or = [{ _id: identifier }, { slug: identifier.toLowerCase() }];
    } else {
      filter.slug = identifier.toLowerCase();
    }
    return this.properties.findOne(filter).select('-__v').lean().exec();
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
