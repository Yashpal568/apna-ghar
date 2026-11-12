import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

export type AuditActionType =
  | 'user_suspend'
  | 'user_reactivate'
  | 'property_hide'
  | 'property_restore'
  | 'property_remove'
  | 'report_review'
  | 'report_resolve'
  | 'report_dismiss'
  | 'category_update'
  | 'category_toggle';

export type AuditTargetType = 'user' | 'property' | 'report' | 'category';

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, trim: true, index: true })
  adminUserId!: string;

  @Prop({
    required: true,
    enum: [
      'user_suspend',
      'user_reactivate',
      'property_hide',
      'property_restore',
      'property_remove',
      'report_review',
      'report_resolve',
      'report_dismiss',
      'category_update',
      'category_toggle',
    ],
    index: true,
  })
  action!: AuditActionType;

  @Prop({ required: true, enum: ['user', 'property', 'report', 'category'], index: true })
  targetType!: AuditTargetType;

  @Prop({ required: true, trim: true, index: true })
  targetId!: string;

  @Prop({ trim: true, maxlength: 1000, default: '' })
  reason!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  details!: Record<string, unknown>;

  createdAt!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
AuditLogSchema.index({ adminUserId: 1, createdAt: -1 });
