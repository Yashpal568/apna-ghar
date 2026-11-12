import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { UserProfile, UserProfileDocument } from '../users/schemas/user-profile.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { PropertyReport, PropertyReportDocument } from '../properties/schemas/property-report.schema';
import { PropertyCategory, PropertyCategoryDocument } from '../categories/schemas/property-category.schema';
import { AdminAuditService } from './admin-audit.service';
import {
  ListAdminPropertiesQueryDto,
  ListUsersQueryDto,
  ModeratePropertyStatusDto,
  UpdateCategoryDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(UserProfile.name) private readonly users: Model<UserProfileDocument>,
    @InjectModel(Property.name) private readonly properties: Model<PropertyDocument>,
    @InjectModel(PropertyReport.name) private readonly reports: Model<PropertyReportDocument>,
    @InjectModel(PropertyCategory.name) private readonly categories: Model<PropertyCategoryDocument>,
    private readonly audit: AdminAuditService,
  ) {}

  async getOverviewMetrics() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalProperties,
      activeListings,
      hiddenListings,
      removedListings,
      pendingReports,
      resolvedReports,
      recentUsers,
      recentProperties,
      recentAuditLogs,
    ] = await Promise.all([
      this.users.countDocuments().exec(),
      this.users.countDocuments({ accountStatus: 'active' }).exec(),
      this.users.countDocuments({ accountStatus: 'suspended' }).exec(),
      this.properties.countDocuments({ deletedAt: null }).exec(),
      this.properties.countDocuments({ status: 'active', deletedAt: null }).exec(),
      this.properties.countDocuments({ status: 'hidden_by_owner', deletedAt: null }).exec(),
      this.properties.countDocuments({ status: 'removed_by_admin' }).exec(),
      this.reports.countDocuments({ status: { $in: ['open', 'reviewing'] } }).exec(),
      this.reports.countDocuments({ status: 'resolved' }).exec(),
      this.users.find().sort({ createdAt: -1 }).limit(5).select('-__v').lean().exec(),
      this.properties.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(5).select('-__v').lean().exec(),
      this.audit.listLogs({ limit: 5 }),
    ]);

    return {
      metrics: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalProperties,
        activeListings,
        hiddenListings,
        removedListings,
        pendingReports,
        resolvedReports,
      },
      recentUsers,
      recentProperties,
      recentAuditLogs: recentAuditLogs.items,
    };
  }

  async listUsers(query: ListUsersQueryDto) {
    const filter: FilterQuery<UserProfileDocument> = {};
    if (query.role) filter.role = query.role;
    if (query.status) filter.accountStatus = query.status;
    if (query.q) {
      const regex = new RegExp(this.escapeRegex(query.q), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { city: regex }, { clerkUserId: regex }];
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const [items, total] = await Promise.all([
      this.users
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-__v')
        .lean()
        .exec(),
      this.users.countDocuments(filter).exec(),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getUserDetails(clerkUserId: string) {
    const user = await this.users.findOne({ clerkUserId }).select('-__v').lean().exec();
    if (!user) throw new NotFoundException('User account not found.');

    const listings = await this.properties
      .find({ ownerId: clerkUserId })
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean()
      .exec();

    return { user, listings, listingsCount: listings.length };
  }

  async setUserStatus(adminUserId: string, targetClerkUserId: string, input: UpdateUserStatusDto) {
    if (adminUserId === targetClerkUserId) {
      throw new BadRequestException('Admins cannot suspend their own account.');
    }

    const user = await this.users.findOne({ clerkUserId: targetClerkUserId }).exec();
    if (!user) throw new NotFoundException('User account not found.');

    const previousStatus = user.accountStatus;
    user.accountStatus = input.status;
    await user.save();

    const action = input.status === 'suspended' ? 'user_suspend' : 'user_reactivate';
    await this.audit.recordLog(adminUserId, action, 'user', targetClerkUserId, input.reason, {
      previousStatus,
      nextStatus: input.status,
    });

    return { success: true, clerkUserId: targetClerkUserId, status: input.status };
  }

  async listProperties(query: ListAdminPropertiesQueryDto) {
    const filter: FilterQuery<PropertyDocument> = {};
    if (query.status) {
      filter.status = query.status;
    }
    if (query.city) {
      filter['location.city'] = new RegExp(this.escapeRegex(query.city), 'i');
    }
    if (query.ownerId) {
      filter.ownerId = query.ownerId;
    }
    if (query.q) {
      const regex = new RegExp(this.escapeRegex(query.q), 'i');
      filter.$or = [{ title: regex }, { description: regex }, { slug: regex }, { 'location.locality': regex }];
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const [items, total] = await Promise.all([
      this.properties
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-__v')
        .lean()
        .exec(),
      this.properties.countDocuments(filter).exec(),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getPropertyDetails(propertyId: string) {
    const mongoose = await import('mongoose');
    if (!mongoose.isValidObjectId(propertyId)) throw new NotFoundException('Property not found.');

    const property = await this.properties.findById(propertyId).select('-__v').lean().exec();
    if (!property) throw new NotFoundException('Property not found.');

    const [owner, reports] = await Promise.all([
      this.users.findOne({ clerkUserId: property.ownerId }).select('clerkUserId name email phone city imageUrl role accountStatus').lean().exec(),
      this.reports.find({ propertyId }).sort({ createdAt: -1 }).select('-__v').lean().exec(),
    ]);

    return { property, owner, reports };
  }

  async moderateProperty(adminUserId: string, propertyId: string, input: ModeratePropertyStatusDto) {
    const mongoose = await import('mongoose');
    if (!mongoose.isValidObjectId(propertyId)) throw new NotFoundException('Property not found.');

    const property = await this.properties.findById(propertyId).exec();
    if (!property) throw new NotFoundException('Property not found.');

    const previousStatus = property.status;
    property.status = input.status;
    if (input.status === 'removed_by_admin') {
      property.deletedAt = new Date();
    } else if (previousStatus === 'removed_by_admin' && input.status === 'active') {
      property.deletedAt = null;
    }
    await property.save();

    const action = input.status === 'active' ? 'property_restore' : input.status === 'hidden_by_owner' ? 'property_hide' : 'property_remove';
    await this.audit.recordLog(adminUserId, action, 'property', propertyId, input.reason, {
      previousStatus,
      nextStatus: input.status,
      slug: property.slug,
    });

    return { success: true, propertyId, status: input.status };
  }

  async listCategories() {
    return this.categories.find().sort({ sortOrder: 1, label: 1 }).select('-__v').lean().exec();
  }

  async toggleCategory(adminUserId: string, key: string, active: boolean) {
    const category = await this.categories.findOne({ key }).exec();
    if (!category) throw new NotFoundException('Category not found.');

    const previous = category.active;
    category.active = active;
    await category.save();

    await this.audit.recordLog(adminUserId, 'category_toggle', 'category', key, `Category ${key} set to ${active ? 'active' : 'inactive'}`, {
      previousActive: previous,
      nextActive: active,
    });

    return { success: true, key, active };
  }

  async updateCategory(adminUserId: string, key: string, input: UpdateCategoryDto) {
    const category = await this.categories.findOne({ key }).exec();
    if (!category) throw new NotFoundException('Category not found.');

    if (input.label !== undefined) category.label = input.label.trim();
    if (input.icon !== undefined) category.icon = input.icon.trim();
    if (input.sortOrder !== undefined) category.sortOrder = input.sortOrder;
    await category.save();

    await this.audit.recordLog(adminUserId, 'category_update', 'category', key, `Updated category ${key}`, {
      label: category.label,
      icon: category.icon,
      sortOrder: category.sortOrder,
    });

    return { success: true, category: category.toObject() };
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
