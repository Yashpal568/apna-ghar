import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VisitRequest, VisitRequestDocument } from './schemas/visit-request.schema';
import { Property, PropertyDocument } from './schemas/property.schema';

@Injectable()
export class VisitRequestsService {
  constructor(
    @InjectModel(VisitRequest.name) private readonly requests: Model<VisitRequestDocument>,
    @InjectModel(Property.name) private readonly properties: Model<PropertyDocument>,
  ) {}

  async listMine(userId: string) {
    return this.requests.find({ userId }).sort({ createdAt: -1 }).lean().exec();
  }

  async create(userId: string, propertyId: string, input: { preferredDate: string; preferredTime: string; message?: string }) {
    const mongoose = await import('mongoose');
    if (!mongoose.isValidObjectId(propertyId)) return null;
    const property = await this.properties.findOne({ _id: propertyId, status: 'active', deletedAt: null }).select('_id').lean().exec();
    if (!property) return null;
    const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const today = `${todayParts.find((part) => part.type === 'year')?.value}-${todayParts.find((part) => part.type === 'month')?.value}-${todayParts.find((part) => part.type === 'day')?.value}`;
    if (input.preferredDate < today) throw new BadRequestException('Visit date must be today or later.');
    return this.requests.create({
      userId,
      propertyId,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      message: input.message?.trim() ?? '',
      status: 'requested',
    });
  }
}
