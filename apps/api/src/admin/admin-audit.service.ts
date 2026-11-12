import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { AuditActionType, AuditLog, AuditLogDocument, AuditTargetType } from './schemas/audit-log.schema';

@Injectable()
export class AdminAuditService {
  constructor(@InjectModel(AuditLog.name) private readonly auditLogs: Model<AuditLogDocument>) {}

  async recordLog(
    adminUserId: string,
    action: AuditActionType,
    targetType: AuditTargetType,
    targetId: string,
    reason = '',
    details: Record<string, unknown> = {},
  ) {
    return this.auditLogs.create({
      adminUserId,
      action,
      targetType,
      targetId,
      reason: (reason || '').trim().slice(0, 1000),
      details,
    });
  }

  async listLogs(query: { targetType?: string; action?: string; adminUserId?: string; page?: number; limit?: number }) {
    const filter: FilterQuery<AuditLogDocument> = {};
    if (query.targetType) filter.targetType = query.targetType;
    if (query.action) filter.action = query.action;
    if (query.adminUserId) filter.adminUserId = query.adminUserId;

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const [items, total] = await Promise.all([
      this.auditLogs
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.auditLogs.countDocuments(filter).exec(),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}
