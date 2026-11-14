import { ForbiddenException, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminController } from '../src/admin/admin.controller';
import { AdminService } from '../src/admin/admin.service';
import { AdminAuditService } from '../src/admin/admin-audit.service';
import { AdminAuthGuard } from '../src/properties/admin-auth.guard';

describe('Admin Module Endpoints (e2e)', () => {
  let app: INestApplication;
  let authRole: 'ADMIN' | 'USER' | 'UNAUTHENTICATED' = 'ADMIN';

  const mockAdminService = {
    getOverviewMetrics: jest.fn().mockResolvedValue({
      totalUsers: 142,
      totalProperties: 58,
      activeProperties: 45,
      totalReports: 12,
      openReports: 3,
      totalConversations: 89,
      totalOffers: 34,
      pendingOffers: 6,
      auditLogsRecent: 15,
    }),
    listUsers: jest.fn().mockResolvedValue({
      items: [{ clerkUserId: 'user_1', name: 'Test User', role: 'USER', accountStatus: 'active' }],
      pagination: { total: 1, page: 1, limit: 20, pages: 1 },
    }),
    getUserDetails: jest.fn().mockImplementation(async (userId: string) => {
      if (userId === 'user_1') {
        return { clerkUserId: 'user_1', name: 'Test User', role: 'USER', accountStatus: 'active' };
      }
      return null;
    }),
    setUserStatus: jest.fn().mockResolvedValue({
      success: true,
      user: { clerkUserId: 'user_1', accountStatus: 'suspended' },
    }),
    listProperties: jest.fn().mockResolvedValue({
      items: [{ _id: 'prop_1', title: 'Luxury Apt', status: 'active', priceAmount: 5000000 }],
      pagination: { total: 1, page: 1, limit: 20, pages: 1 },
    }),
    getPropertyDetails: jest.fn().mockImplementation(async (propertyId: string) => {
      if (propertyId === 'prop_1') {
        return { _id: 'prop_1', title: 'Luxury Apt', status: 'active', priceAmount: 5000000 };
      }
      return null;
    }),
    moderateProperty: jest.fn().mockResolvedValue({
      success: true,
      property: { _id: 'prop_1', status: 'hidden_by_owner' },
    }),
    listCategories: jest.fn().mockResolvedValue([
      { key: 'flat', label: 'Apartment / Flat', icon: '⌂', active: true, sortOrder: 1 },
    ]),
    toggleCategory: jest.fn().mockResolvedValue({
      key: 'flat',
      active: false,
    }),
    updateCategory: jest.fn().mockResolvedValue({
      key: 'flat',
      label: 'Updated Apartment',
      icon: '🏢',
      sortOrder: 2,
    }),
  };

  const mockAuditService = {
    listLogs: jest.fn().mockResolvedValue({
      items: [
        {
          _id: 'log_1',
          adminUserId: 'admin_test_1',
          action: 'user_suspend',
          targetType: 'user',
          targetId: 'user_1',
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: { total: 1, page: 1, limit: 20, pages: 1 },
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: AdminAuditService, useValue: mockAuditService },
        { provide: ConfigService, useValue: { get: () => 'test' } },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp: () => { getRequest: () => { authUserId?: string; auth?: { userId: string } } } }) => {
          if (authRole === 'UNAUTHENTICATED') {
            throw new UnauthorizedException('Bearer token required');
          }
          if (authRole === 'USER') {
            throw new ForbiddenException('This account is not authorized for admin operations.');
          }
          const req = context.switchToHttp().getRequest();
          req.authUserId = 'admin_test_1';
          req.auth = { userId: 'admin_test_1' };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.listen(0);
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    authRole = 'ADMIN';
    jest.clearAllMocks();
  });

  it('1. GET /api/v1/admin/overview - returns platform metrics for authorized admin', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/admin/overview`, {
      headers: { Authorization: 'Bearer valid_admin_token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(expect.objectContaining({
      totalUsers: 142,
      totalProperties: 58,
      activeProperties: 45,
    }));
    expect(mockAdminService.getOverviewMetrics).toHaveBeenCalled();
  });

  it('2. GET /api/v1/admin/users - lists users with pagination', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/admin/users?page=1&limit=10`, {
      headers: { Authorization: 'Bearer valid_admin_token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(mockAdminService.listUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }));
  });

  it('3. GET /api/v1/admin/users/:userId - returns user details', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/admin/users/user_1`, {
      headers: { Authorization: 'Bearer valid_admin_token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clerkUserId).toBe('user_1');
    expect(mockAdminService.getUserDetails).toHaveBeenCalledWith('user_1');
  });

  it('4. POST /api/v1/admin/users/:userId/status - updates status and logs action', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/admin/users/user_1/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid_admin_token' },
      body: JSON.stringify({ status: 'suspended', reason: 'Terms violation' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockAdminService.setUserStatus).toHaveBeenCalledWith(
      'admin_test_1',
      'user_1',
      expect.objectContaining({ status: 'suspended', reason: 'Terms violation' }),
    );
  });

  it('5. GET /api/v1/admin/properties - lists properties across statuses', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/admin/properties?status=active`, {
      headers: { Authorization: 'Bearer valid_admin_token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(mockAdminService.listProperties).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });

  it('6. GET /api/v1/admin/properties/:propertyId - returns single property detail', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/admin/properties/prop_1`, {
      headers: { Authorization: 'Bearer valid_admin_token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._id).toBe('prop_1');
    expect(mockAdminService.getPropertyDetails).toHaveBeenCalledWith('prop_1');
  });

  it('7. POST /api/v1/admin/properties/:propertyId/status - moderates property status', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/admin/properties/prop_1/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid_admin_token' },
      body: JSON.stringify({ status: 'hidden_by_owner', reason: 'Verification pending' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockAdminService.moderateProperty).toHaveBeenCalledWith(
      'admin_test_1',
      'prop_1',
      expect.objectContaining({ status: 'hidden_by_owner', reason: 'Verification pending' }),
    );
  });

  it('8. GET /api/v1/admin/categories - lists all categories including inactive', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/admin/categories`, {
      headers: { Authorization: 'Bearer valid_admin_token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(mockAdminService.listCategories).toHaveBeenCalled();
  });

  it('9. POST /api/v1/admin/categories/:key/toggle - toggles category active status', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/admin/categories/flat/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid_admin_token' },
      body: JSON.stringify({ active: false }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.active).toBe(false);
    expect(mockAdminService.toggleCategory).toHaveBeenCalledWith('admin_test_1', 'flat', false);
  });

  it('10. PATCH /api/v1/admin/categories/:key - updates category metadata', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/admin/categories/flat`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid_admin_token' },
      body: JSON.stringify({ label: 'Updated Apartment', icon: '🏢', sortOrder: 2 }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.label).toBe('Updated Apartment');
    expect(mockAdminService.updateCategory).toHaveBeenCalledWith(
      'admin_test_1',
      'flat',
      expect.objectContaining({ label: 'Updated Apartment', icon: '🏢', sortOrder: 2 }),
    );
  });

  it('11. GET /api/v1/admin/audit-logs - lists audit log trail', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/admin/audit-logs?action=user_suspend`, {
      headers: { Authorization: 'Bearer valid_admin_token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(mockAuditService.listLogs).toHaveBeenCalledWith(expect.objectContaining({ action: 'user_suspend' }));
  });

  it('Security: Rejects unauthenticated request with 401', async () => {
    authRole = 'UNAUTHENTICATED';
    const res = await fetch(`${await app.getUrl()}/api/v1/admin/overview`);
    expect(res.status).toBe(401);
  });

  it('Security: Rejects non-admin user request with 403 Forbidden', async () => {
    authRole = 'USER';
    const res = await fetch(`${await app.getUrl()}/api/v1/admin/overview`, {
      headers: { Authorization: 'Bearer normal_user_token' },
    });
    expect(res.status).toBe(403);
  });
});
