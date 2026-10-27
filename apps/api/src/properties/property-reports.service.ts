import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PropertyReport, PropertyReportDocument } from './schemas/property-report.schema';
import { Property, PropertyDocument } from './schemas/property.schema';

@Injectable()
export class PropertyReportsService {
  constructor(
    @InjectModel(PropertyReport.name) private readonly reports: Model<PropertyReportDocument>,
    @InjectModel(Property.name) private readonly properties: Model<PropertyDocument>,
  ) {}

  async listForModeration(status?: string) {
    const filter: Record<string, unknown> = {};
    if (status && ['open', 'reviewing', 'resolved', 'dismissed'].includes(status)) filter.status = status;
    return this.reports.find(filter).sort({ createdAt: -1 }).limit(200).lean().exec();
  }

  async moderate(reportId: string, status: string) {
    const mongoose = await import('mongoose');
    if (!mongoose.isValidObjectId(reportId) || !['reviewing', 'resolved', 'dismissed', 'open'].includes(status)) return null;
    return this.reports.findByIdAndUpdate(reportId, { $set: { status } }, { new: true, runValidators: true }).lean().exec();
  }

  async listMine(reporterId: string) {
    return this.reports.find({ reporterId }).sort({ createdAt: -1 }).lean().exec();
  }

  async create(reporterId: string, propertyId: string, reason: string, details = '') {
    const mongoose = await import('mongoose');
    if (!mongoose.isValidObjectId(propertyId)) return null;
    const property = await this.properties.findOne({ _id: propertyId, status: 'active', deletedAt: null }).select('_id ownerId').lean().exec();
    if (!property || property.ownerId === reporterId) return null;
    const duplicate = await this.reports.findOne({ reporterId, propertyId, status: { $in: ['open', 'reviewing'] } }).lean().exec();
    if (duplicate) return duplicate;
    return this.reports.create({ reporterId, propertyId, reason, details: details.trim(), status: 'open' });
  }
}
