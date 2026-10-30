import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PropertyCategory, PropertyCategoryDocument } from './schemas/property-category.schema';
const DEFAULT_CATEGORIES = [
 { key: 'apartment', label: 'Apartments & flats', icon: '⌂', sortOrder: 1 },
 { key: 'house', label: 'Villas & houses', icon: '⌂', sortOrder: 2 },
 { key: 'villa', label: 'Villas', icon: '⌂', sortOrder: 3 },
 { key: 'plot', label: 'Plots & land', icon: '⌁', sortOrder: 4 },
 { key: 'commercial', label: 'Shops & offices', icon: '▤', sortOrder: 5 },
 { key: 'pg', label: 'PG & coliving', icon: '▧', sortOrder: 6 },
];
@Injectable()
export class CategoriesService implements OnModuleInit {
 constructor(@InjectModel(PropertyCategory.name) private readonly categories: Model<PropertyCategoryDocument>) {}
 async onModuleInit() {
   await this.categories.bulkWrite(DEFAULT_CATEGORIES.map(item => ({ updateOne: { filter: { key: item.key }, update: { $setOnInsert: { ...item, active: true } }, upsert: true } })), { ordered: false });
 }
 listActive() { return this.categories.find({ active: true }).sort({ sortOrder: 1, label: 1 }).select('key label icon sortOrder').lean().exec(); }
}
