import { UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SavedPropertiesController, SyncSavedPropertiesDto } from '../src/properties/saved-properties.controller';
import { SavedPropertiesService } from '../src/properties/saved-properties.service';
import { PropertyAuthGuard } from '../src/properties/property-auth.guard';

describe('Saved Properties Module Endpoints (e2e)', () => {
  let app: INestApplication;
  let authenticated = true;

  const mockSavedPropertiesService = {
    list: jest.fn().mockImplementation(async (userId: string) => [
      {
        userId,
        propertyId: '507f1f77bcf86cd799439011',
        createdAt: new Date().toISOString(),
        property: {
          _id: '507f1f77bcf86cd799439011',
          title: 'Modern 3BHK',
          priceAmount: 8500000,
        },
      },
    ]),
    sync: jest.fn().mockImplementation(async (userId: string, propertyIds: string[]) => {
      return { syncedCount: propertyIds.length, totalSaved: propertyIds.length };
    }),
    isSaved: jest.fn().mockImplementation(async (_userId: string, propertyId: string) => {
      return propertyId === '507f1f77bcf86cd799439011';
    }),
    add: jest.fn().mockImplementation(async (userId: string, propertyId: string) => {
      if (propertyId === 'non_existent_id') return null;
      return { userId, propertyId, createdAt: new Date() };
    }),
    remove: jest.fn().mockImplementation(async (userId: string, propertyId: string) => {
      return { success: true, propertyId };
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SavedPropertiesController],
      providers: [
        { provide: SavedPropertiesService, useValue: mockSavedPropertiesService },
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

  it('1. GET /api/v1/saved-properties - lists saved properties for current user', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/saved-properties`, {
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].propertyId).toBe('507f1f77bcf86cd799439011');
    expect(mockSavedPropertiesService.list).toHaveBeenCalledWith('user_buyer_1');
  });

  it('2. POST /api/v1/saved-properties/sync - syncs an array of saved property IDs', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/saved-properties/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ propertyIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.syncedCount).toBe(2);
    expect(mockSavedPropertiesService.sync).toHaveBeenCalledWith('user_buyer_1', ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']);
  });

  it('3. GET /api/v1/saved-properties/check/:propertyId - checks if a property is saved', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/saved-properties/check/507f1f77bcf86cd799439011`, {
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ propertyId: '507f1f77bcf86cd799439011', isSaved: true });
    expect(mockSavedPropertiesService.isSaved).toHaveBeenCalledWith('user_buyer_1', '507f1f77bcf86cd799439011');
  });

  it('4. POST /api/v1/saved-properties/:propertyId - saves a property to bookmarks', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/saved-properties/507f1f77bcf86cd799439011`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.propertyId).toBe('507f1f77bcf86cd799439011');
    expect(mockSavedPropertiesService.add).toHaveBeenCalledWith('user_buyer_1', '507f1f77bcf86cd799439011');
  });

  it('5. POST /api/v1/saved-properties/:propertyId - returns 404 if property not found', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/saved-properties/non_existent_id`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(404);
  });

  it('6. DELETE /api/v1/saved-properties/:propertyId - removes saved property', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/saved-properties/507f1f77bcf86cd799439011`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSavedPropertiesService.remove).toHaveBeenCalledWith('user_buyer_1', '507f1f77bcf86cd799439011');
  });

  it('Security: Rejects unauthenticated request with 401', async () => {
    authenticated = false;
    const res = await fetch(`${await app.getUrl()}/api/v1/saved-properties`);
    expect(res.status).toBe(401);
  });
});
