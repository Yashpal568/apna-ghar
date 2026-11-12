import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let userModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    countDocuments: jest.Mock;
  };
  let propertyModel: {
    find: jest.Mock;
    findById: jest.Mock;
    countDocuments: jest.Mock;
  };
  let reportModel: {
    find: jest.Mock;
    countDocuments: jest.Mock;
  };
  let categoryModel: {
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let auditService: {
    recordLog: jest.Mock;
    listLogs: jest.Mock;
  };

  const adminId = 'clerk_admin_1';
  const targetUserId = 'clerk_user_2';
  const propertyId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    jest.clearAllMocks();
    userModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(10) }),
    };
    propertyModel = {
      find: jest.fn(),
      findById: jest.fn(),
      countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(5) }),
    };
    reportModel = {
      find: jest.fn(),
      countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(2) }),
    };
    categoryModel = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    auditService = {
      recordLog: jest.fn().mockResolvedValue({ _id: 'log_1' }),
      listLogs: jest.fn().mockResolvedValue({ items: [], pagination: { total: 0 } }),
    };

    service = new AdminService(
      userModel as never,
      propertyModel as never,
      reportModel as never,
      categoryModel as never,
      auditService as never,
    );
  });

  describe('getOverviewMetrics', () => {
    it('aggregates real counts and activity without demo numbers', async () => {
      userModel.find.mockReturnValue({
        sort: () => ({ limit: () => ({ select: () => ({ lean: () => ({ exec: async () => [{ clerkUserId: 'u1' }] }) }) }) }),
      });
      propertyModel.find.mockReturnValue({
        sort: () => ({ limit: () => ({ select: () => ({ lean: () => ({ exec: async () => [{ _id: 'p1' }] }) }) }) }),
      });

      const result = await service.getOverviewMetrics();
      expect(result.metrics.totalUsers).toBe(10);
      expect(result.metrics.totalProperties).toBe(5);
      expect(result.metrics.pendingReports).toBe(2);
      expect(result.recentUsers).toHaveLength(1);
      expect(result.recentProperties).toHaveLength(1);
    });
  });

  describe('User Management', () => {
    it('prevents an admin from suspending their own account', async () => {
      await expect(
        service.setUserStatus(adminId, adminId, { status: 'suspended', reason: 'Self-test' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(auditService.recordLog).not.toHaveBeenCalled();
    });

    it('suspends target user and records audit log', async () => {
      const mockUser = {
        clerkUserId: targetUserId,
        accountStatus: 'active',
        save: jest.fn().mockResolvedValue(true),
      };
      userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });

      const result = await service.setUserStatus(adminId, targetUserId, {
        status: 'suspended',
        reason: 'Violation of marketplace terms',
      });

      expect(result).toEqual({ success: true, clerkUserId: targetUserId, status: 'suspended' });
      expect(mockUser.accountStatus).toBe('suspended');
      expect(mockUser.save).toHaveBeenCalled();
      expect(auditService.recordLog).toHaveBeenCalledWith(
        adminId,
        'user_suspend',
        'user',
        targetUserId,
        'Violation of marketplace terms',
        { previousStatus: 'active', nextStatus: 'suspended' },
      );
    });

    it('reactivates suspended user and records audit log', async () => {
      const mockUser = {
        clerkUserId: targetUserId,
        accountStatus: 'suspended',
        save: jest.fn().mockResolvedValue(true),
      };
      userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });

      const result = await service.setUserStatus(adminId, targetUserId, {
        status: 'active',
        reason: 'Account cleared after review',
      });

      expect(result.status).toBe('active');
      expect(mockUser.accountStatus).toBe('active');
      expect(auditService.recordLog).toHaveBeenCalledWith(
        adminId,
        'user_reactivate',
        'user',
        targetUserId,
        'Account cleared after review',
        { previousStatus: 'suspended', nextStatus: 'active' },
      );
    });
  });

  describe('Property Moderation', () => {
    it('moderates a property to hidden_by_owner and logs the action', async () => {
      const mockProperty = {
        _id: propertyId,
        slug: 'delhi-villa',
        status: 'active',
        save: jest.fn().mockResolvedValue(true),
      };
      propertyModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockProperty) });

      const result = await service.moderateProperty(adminId, propertyId, {
        status: 'hidden_by_owner',
        reason: 'Temporary investigation',
      });

      expect(result.status).toBe('hidden_by_owner');
      expect(mockProperty.status).toBe('hidden_by_owner');
      expect(auditService.recordLog).toHaveBeenCalledWith(
        adminId,
        'property_hide',
        'property',
        propertyId,
        'Temporary investigation',
        expect.objectContaining({ slug: 'delhi-villa' }),
      );
    });

    it('removes fraudulent property, sets deletedAt, and logs property_remove', async () => {
      const mockProperty = {
        _id: propertyId,
        slug: 'scam-flat',
        status: 'active',
        deletedAt: null as Date | null,
        save: jest.fn().mockResolvedValue(true),
      };
      propertyModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockProperty) });

      const result = await service.moderateProperty(adminId, propertyId, {
        status: 'removed_by_admin',
        reason: 'Confirmed fraudulent listing',
      });

      expect(result.status).toBe('removed_by_admin');
      expect(mockProperty.deletedAt).toBeInstanceOf(Date);
      expect(auditService.recordLog).toHaveBeenCalledWith(
        adminId,
        'property_remove',
        'property',
        propertyId,
        'Confirmed fraudulent listing',
        expect.any(Object),
      );
    });
  });

  describe('Category Administration', () => {
    it('toggles category active status and creates an audit log', async () => {
      const mockCategory = {
        key: 'villa',
        active: true,
        save: jest.fn().mockResolvedValue(true),
      };
      categoryModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockCategory) });

      const result = await service.toggleCategory(adminId, 'villa', false);
      expect(result).toEqual({ success: true, key: 'villa', active: false });
      expect(mockCategory.active).toBe(false);
      expect(auditService.recordLog).toHaveBeenCalledWith(
        adminId,
        'category_toggle',
        'category',
        'villa',
        expect.any(String),
        { previousActive: true, nextActive: false },
      );
    });
  });
});
