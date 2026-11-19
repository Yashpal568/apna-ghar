import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  async listReceived(ownerId: string) {
    const ownerProperties = await this.properties.find({ ownerId, deletedAt: null }).select('_id').lean().exec();
    const propertyIds = ownerProperties.map((p) => String(p._id));
    if (!propertyIds.length) return [];
    return this.requests.find({ propertyId: { $in: propertyIds } }).sort({ createdAt: -1 }).lean().exec();
  }

  async create(userId: string, propertyId: string, input: { preferredDate: string; preferredTime: string; message?: string }) {
    const mongoose = await import('mongoose');
    if (!mongoose.isValidObjectId(propertyId)) return null;
    const property = await this.properties.findOne({ _id: propertyId, status: 'active', deletedAt: null }).select('_id ownerId').lean().exec();
    if (!property) return null;
    if (property.ownerId === userId) {
      throw new BadRequestException('You cannot schedule a visit request on your own property.');
    }
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

  async updateStatus(userId: string, requestId: string, targetStatus: string) {
    const mongoose = await import('mongoose');
    if (!mongoose.isValidObjectId(requestId)) {
      throw new NotFoundException('Visit request not found');
    }

    const visit = await this.requests.findById(requestId).exec();
    if (!visit) {
      throw new NotFoundException('Visit request not found');
    }

    const property = await this.properties
      .findOne({ _id: visit.propertyId, deletedAt: null })
      .select('_id ownerId')
      .lean()
      .exec();

    const isOwner = property && property.ownerId === userId;
    const isBuyer = visit.userId === userId;

    if (!isOwner && !isBuyer) {
      throw new ForbiddenException('Not authorized to update this visit request');
    }

    let finalStatus: 'confirmed' | 'declined' | 'cancelled';
    const normalized = targetStatus.toLowerCase().trim();
    if (['confirmed', 'confirm', 'accept', 'accepted'].includes(normalized)) {
      finalStatus = 'confirmed';
    } else if (['declined', 'decline', 'reject', 'rejected'].includes(normalized)) {
      finalStatus = 'declined';
    } else if (['cancelled', 'cancel'].includes(normalized)) {
      finalStatus = 'cancelled';
    } else {
      throw new BadRequestException(`Invalid status: ${targetStatus}`);
    }

    if (finalStatus === 'confirmed' || finalStatus === 'declined') {
      if (!isOwner) {
        throw new ForbiddenException('Only the property owner can accept or decline this visit request');
      }
    } else if (finalStatus === 'cancelled') {
      if (!isBuyer && !isOwner) {
        throw new ForbiddenException('Only the requester or property owner can cancel this visit request');
      }
    }

    visit.status = finalStatus;
    await visit.save();
    return visit.toObject ? visit.toObject() : visit;
  }
}
