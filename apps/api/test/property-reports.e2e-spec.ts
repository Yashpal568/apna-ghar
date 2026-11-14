import { ForbiddenException, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PropertyReportsController } from '../src/properties/property-reports.controller';
import { PropertyReportsService } from '../src/properties/property-reports.service';
import { PropertyAuthGuard } from '../src/properties/property-auth.guard';
import { AdminAuthGuard } from '../src/properties/admin-auth.guard';

describe('Property Reports Module Endpoints (e2e)', () => {
  let app: INestApplication;
  let authState: 'ADMIN' | 'USER' | 'UNAUTHENTICATED' = 'USER';

  const mockPropertyReportsService = {
    listForModeration: jest.fn().mockImplementation(async (status?: string) => [
      {
        _id: 'rep_1',
        reporterId: 'user_1',
        propertyId: '507f1f77bcf86cd799439011',
        reason: 'misleading',
        details: 'Incorrect price listed',
        status: status || 'open',
      },
    ]),
    moderate: jest.fn().mockImplementation(async (reportId: string, status: string, notes?: string, adminUserId?: string) => {
      if (reportId === 'non_existent') return null;
      return {
        _id: reportId,
        status,
        notes: notes || '',
        moderatedBy: adminUserId,
      };
    }),
    listMine: jest.fn().mockImplementation(async (userId: string) => [
      {
        _id: 'rep_2',
        reporterId: userId,
        propertyId: '507f1f77bcf86cd799439011',
        reason: 'scam',
        details: 'Suspicious contact information',
        status: 'open',
      },
    ]),
    create: jest.fn().mockImplementation(async (userId: string, propertyId: string, reason: string, details?: string) => {
      if (propertyId === 'non_existent') return null;
      return {
        _id: 'rep_3',
        reporterId: userId,
        propertyId,
        reason,
        details: details || '',
        status: 'open',
      };
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PropertyReportsController],
      providers: [
        { provide: PropertyReportsService, useValue: mockPropertyReportsService },
        { provide: ConfigService, useValue: { get: () => 'test' } },
      ],
    })
      .overrideGuard(PropertyAuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp: () => { getRequest: () => { authUserId?: string; auth?: { userId: string } } } }) => {
          if (authState === 'UNAUTHENTICATED') throw new UnauthorizedException('Bearer token required');
          const req = context.switchToHttp().getRequest();
          req.authUserId = authState === 'ADMIN' ? 'admin_test_1' : 'user_test_1';
          req.auth = { userId: req.authUserId };
          return true;
        },
      })
      .overrideGuard(AdminAuthGuard)
      .useValue({
        canActivate: () => {
          if (authState === 'UNAUTHENTICATED') throw new UnauthorizedException('Bearer token required');
          if (authState !== 'ADMIN') throw new ForbiddenException('Admin operations require administrative privileges');
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
    authState = 'USER';
    jest.clearAllMocks();
  });

  it('1. GET /api/v1/property-reports - lists reports submitted by current user', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/property-reports`, {
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]._id).toBe('rep_2');
    expect(mockPropertyReportsService.listMine).toHaveBeenCalledWith('user_test_1');
  });

  it('2. POST /api/v1/property-reports/:propertyId - creates report with valid reason enum', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/property-reports/507f1f77bcf86cd799439011`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ reason: 'misleading', details: 'The photo does not match address' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body._id).toBe('rep_3');
    expect(mockPropertyReportsService.create).toHaveBeenCalledWith(
      'user_test_1',
      '507f1f77bcf86cd799439011',
      'misleading',
      'The photo does not match address',
    );
  });

  it('3. POST /api/v1/property-reports/:propertyId - rejects invalid reason with 400', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/property-reports/507f1f77bcf86cd799439011`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ reason: 'fake_reason_not_in_enum' }),
    });
    expect(res.status).toBe(400);
  });

  it('4. GET /api/v1/property-reports/admin - admin can list reports for moderation', async () => {
    authState = 'ADMIN';
    const res = await fetch(`${await app.getUrl()}/api/v1/property-reports/admin?status=open`, {
      headers: { Authorization: 'Bearer admin_token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(mockPropertyReportsService.listForModeration).toHaveBeenCalledWith('open');
  });

  it('5. GET /api/v1/property-reports/admin - non-admin receives 403 Forbidden', async () => {
    authState = 'USER';
    const res = await fetch(`${await app.getUrl()}/api/v1/property-reports/admin`, {
      headers: { Authorization: 'Bearer normal_token' },
    });
    expect(res.status).toBe(403);
  });

  it('6. POST /api/v1/property-reports/admin/:reportId/status - admin moderates report status', async () => {
    authState = 'ADMIN';
    const res = await fetch(`${await app.getUrl()}/api/v1/property-reports/admin/rep_1/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer admin_token' },
      body: JSON.stringify({ status: 'resolved', notes: 'Seller updated the description' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('resolved');
    expect(mockPropertyReportsService.moderate).toHaveBeenCalledWith(
      'rep_1',
      'resolved',
      'Seller updated the description',
      'admin_test_1',
    );
  });

  it('7. POST /api/v1/property-reports/admin/:reportId/status - non-admin receives 403 Forbidden', async () => {
    authState = 'USER';
    const res = await fetch(`${await app.getUrl()}/api/v1/property-reports/admin/rep_1/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer user_token' },
      body: JSON.stringify({ status: 'resolved' }),
    });
    expect(res.status).toBe(403);
  });
});
