import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder } from 'mongoose';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { Property, PropertyDocument } from './schemas/property.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name) private readonly properties: Model<PropertyDocument>,
    @Optional() private readonly usersService?: UsersService,
  ) {}

  async create(ownerId: string, input: CreatePropertyDto) {
    const base = input.title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || 'property';
    const slug = `${base}-${Date.now().toString(36)}`;
    const property = await this.properties.create({
      ...input,
      ownerId,
      slug,
      status: 'active',
      publishedAt: new Date(),
      deletedAt: null,
    });
    if (this.usersService) {
      await this.usersService.promoteToOwner(ownerId);
    }
    return property.toObject();
  }

  async listMine(ownerId: string) {
    return this.properties.find({ ownerId, deletedAt: null })
      .sort({ publishedAt: -1 }).select('-__v').lean().exec();
  }

  async findMineById(ownerId: string, identifier: string) {
    if (!identifier || typeof identifier !== 'string') return null;
    const clean = identifier.trim();
    if (!clean) return null;
    const mongoose = await import('mongoose');
    const filter: FilterQuery<PropertyDocument> = { ownerId, deletedAt: null };
    if (mongoose.isValidObjectId(clean)) {
      filter.$or = [{ _id: clean }, { slug: clean.toLowerCase() }];
    } else {
      filter.slug = clean.toLowerCase();
    }
    return this.properties.findOne(filter).select('-__v').lean().exec();
  }

  async updateMine(ownerId: string, identifier: string, input: Partial<CreatePropertyDto>) {
    const mongoose = await import('mongoose');
    if (!mongoose.isValidObjectId(identifier)) return null;
    return this.properties.findOneAndUpdate(
      { _id: identifier, ownerId, deletedAt: null },
      { $set: input },
      { new: true, runValidators: true },
    ).select('-__v').lean().exec();
  }

  async setVisibilityMine(ownerId: string, identifier: string, visible: boolean) {
    const mongoose = await import('mongoose');
    if (!mongoose.isValidObjectId(identifier)) return null;
    return this.properties.findOneAndUpdate(
      { _id: identifier, ownerId, deletedAt: null },
      { $set: { status: visible ? 'active' : 'hidden_by_owner' } },
      { new: true, runValidators: true },
    ).select('-__v').lean().exec();
  }

  async removeMine(ownerId: string, identifier: string) {
    const mongoose = await import('mongoose');
    if (!mongoose.isValidObjectId(identifier)) return null;
    return this.properties.findOneAndUpdate(
      { _id: identifier, ownerId, deletedAt: null },
      { $set: { status: 'deleted', deletedAt: new Date() } },
      { new: true },
    ).select('-__v').lean().exec();
  }

  async list(query: ListPropertiesQueryDto) {
    const filter: FilterQuery<PropertyDocument> = { status: 'active', deletedAt: null };
    if (query.city) filter['location.city'] = new RegExp(this.escapeRegex(query.city), 'i');
    if (query.locality) filter['location.locality'] = new RegExp(this.escapeRegex(query.locality), 'i');
    if (query.state) filter['location.state'] = new RegExp(this.escapeRegex(query.state), 'i');

    const rawCategory = query.categoryId || query.type;
    if (rawCategory && rawCategory !== 'all' && rawCategory !== 'all property types') {
      const catLower = rawCategory.toLowerCase().trim();
      const CATEGORY_MAP: Record<string, string[]> = {
        apartment: ['apartment', 'apartments', '6ae3438b927d87c0475f2369'],
        apartments: ['apartment', 'apartments', '6ae3438b927d87c0475f2369'],
        house: ['house', 'houses', '6ae3438b927d87c0475f236a'],
        houses: ['house', 'houses', '6ae3438b927d87c0475f236a'],
        villa: ['villa', 'villas', '6ae3438b927d87c0475f236b'],
        villas: ['villa', 'villas', '6ae3438b927d87c0475f236b'],
        plot: ['plot', 'plots', 'land', '6ae3438b927d87c0475f236c'],
        plots: ['plot', 'plots', 'land', '6ae3438b927d87c0475f236c'],
        commercial: ['commercial', 'office', 'shop', 'shops', 'offices', '6ae3438b927d87c0475f236d'],
        pg: ['pg', 'co-living', 'coliving', '6ae3438b927d87c0475f236e'],
      };
      const matched = CATEGORY_MAP[catLower] || [rawCategory];
      filter.categoryId = matched.length === 1 ? matched[0] : { $in: matched };
    }

    if (query.listingType && query.listingType !== 'all') {
      filter.listingType = query.listingType;
    }
    if (query.minBedrooms !== undefined) filter.bedrooms = { $gte: query.minBedrooms };
    if (query.minBathrooms !== undefined) filter.bathrooms = { $gte: query.minBathrooms };
    if (query.furnishing) filter.furnishing = query.furnishing;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.priceAmount = {};
      if (query.minPrice !== undefined) filter.priceAmount.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.priceAmount.$lte = query.maxPrice;
    }
    if (query.q) {
      const expression = new RegExp(this.escapeRegex(query.q), 'i');
      filter.$or = [
        { title: expression },
        { description: expression },
        { 'location.city': expression },
        { 'location.locality': expression },
        { 'location.state': expression },
        { 'location.addressText': expression },
      ];
    }

    const sort: Record<string, SortOrder> = query.sort === 'price_asc'
      ? { priceAmount: 1 }
      : query.sort === 'price_desc'
      ? { priceAmount: -1 }
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

  async findPublicBySlugOrId(identifier?: string | null) {
    if (!identifier || typeof identifier !== 'string') {
      return null;
    }
    const clean = identifier.trim();
    if (!clean || clean.toLowerCase() === 'undefined' || clean.toLowerCase() === 'null') {
      return null;
    }
    const mongoose = await import('mongoose');
    const filter: FilterQuery<PropertyDocument> = { status: 'active', deletedAt: null };
    if (mongoose.isValidObjectId(clean)) {
      filter.$or = [{ _id: clean }, { slug: clean.toLowerCase() }];
    } else {
      filter.slug = clean.toLowerCase();
    }
    return this.properties.findOneAndUpdate(filter, { $inc: { viewsCount: 1 } }, { new: true }).select('-__v').lean().exec();
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
