import { UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VisitRequestsController } from '../src/properties/visit-requests.controller';
import { VisitRequestsService } from '../src/properties/visit-requests.service';
import { PropertyAuthGuard } from '../src/properties/property-auth.guard';

describe('Visit Requests Module Endpoints (e2e)', () => {
  let app: INestApplication;
  let authenticated = true;

  const mockVisitRequestsService = {
    listMine: jest.fn().mockImplementation(async (userId: string) => [
      {
        _id: 'vr_1',
        userId,
        propertyId: '507f1f77bcf86cd799439011',
        preferredDate: '2026-12-15',
        preferredTime: '11:00',
        message: 'Looking forward to viewing',
        status: 'requested',
      },
    ]),
    listReceived: jest.fn().mockImplementation(async (ownerId: string) => [
      {
        _id: 'vr_2',
        userId: 'buyer_user_2',
        propertyId: '507f1f77bcf86cd799439011',
        preferredDate: '2026-12-16',
        preferredTime: '15:00',
        message: 'Can I visit this afternoon?',
        status: 'requested',
      },
    ]),
    create: jest.fn().mockImplementation(async (userId: string, propertyId: string, dto: { preferredDate: string; preferredTime: string; message?: string }) => {
      if (propertyId === 'non_existent') return null;
      return {
        _id: 'vr_3',
        userId,
        propertyId,
        preferredDate: dto.preferredDate,
        preferredTime: dto.preferredTime,
        message: dto.message || '',
        status: 'requested',
      };
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [VisitRequestsController],
      providers: [
        { provide: VisitRequestsService, useValue: mockVisitRequestsService },
        { provide: ConfigService, useValue: { get: () => 'test' } },
      ],
    })
      .overrideGuard(PropertyAuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp: () => { getRequest: () => { authUserId?: string } } }) => {
          if (!authenticated) throw new UnauthorizedException('Bearer token required');
          context.switchToHttp().getRequest().authUserId = 'user_buyer_1';
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
    authenticated = true;
    jest.clearAllMocks();
  });

  it('1. GET /api/v1/visit-requests - lists visits requested by authenticated user', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/visit-requests`, {
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]._id).toBe('vr_1');
    expect(mockVisitRequestsService.listMine).toHaveBeenCalledWith('user_buyer_1');
  });

  it('2. GET /api/v1/visit-requests/received - lists visits received by owner', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/visit-requests/received`, {
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]._id).toBe('vr_2');
    expect(mockVisitRequestsService.listReceived).toHaveBeenCalledWith('user_buyer_1');
  });

  it('3. POST /api/v1/visit-requests/:propertyId - creates visit request with valid date and time', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/visit-requests/507f1f77bcf86cd799439011`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ preferredDate: '2026-12-20', preferredTime: '14:30', message: 'Ready to visit' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body._id).toBe('vr_3');
    expect(mockVisitRequestsService.create).toHaveBeenCalledWith(
      'user_buyer_1',
      '507f1f77bcf86cd799439011',
      expect.objectContaining({ preferredDate: '2026-12-20', preferredTime: '14:30' }),
    );
  });

  it('4. POST /api/v1/visit-requests/:propertyId - validates invalid time format (rejects with 400)', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/visit-requests/507f1f77bcf86cd799439011`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ preferredDate: '2026-12-20', preferredTime: '25:99' }), // invalid HH:mm
    });
    expect(res.status).toBe(400);
  });

  it('5. POST /api/v1/visit-requests/:propertyId - returns 404 when property is missing', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/visit-requests/non_existent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ preferredDate: '2026-12-20', preferredTime: '14:30' }),
    });
    expect(res.status).toBe(404);
  });

  it('Security: Rejects unauthenticated request with 401', async () => {
    authenticated = false;
    const res = await fetch(`${await app.getUrl()}/api/v1/visit-requests`);
    expect(res.status).toBe(401);
  });
});

