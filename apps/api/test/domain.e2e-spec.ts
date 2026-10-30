import { UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { ClerkAuthGuard } from '../src/auth/clerk-auth.guard';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

jest.mock('@clerk/backend', () => ({ createClerkClient: jest.fn(), verifyToken: jest.fn() }));

describe('M3 identity and profile HTTP (e2e)', () => {
  let app: INestApplication;
  let allowAuth = true;
  const service = {
    syncClerkIdentity: jest.fn(),
    getMyProfile: jest.fn(),
    saveMyProfile: jest.fn(),
  };
  const clerkUser = {
    firstName: 'Yash',
    lastName: 'Pal',
    primaryEmailAddress: { emailAddress: 'yash@example.com' },
    imageUrl: 'https://images.example.com/user.png',
  };

  beforeAll(async () => {
    (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_test_123' });
    (createClerkClient as jest.Mock).mockReturnValue({
      users: { getUser: jest.fn().mockResolvedValue(clerkUser) },
    });
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: service },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('sk_test_example') } },
        {
          provide: ClerkAuthGuard,
          useValue: {
            canActivate: (context: { switchToHttp: () => { getRequest: () => { auth?: { userId: string } } } }) => {
              if (!allowAuth) throw new UnauthorizedException('Bearer token required');
              context.switchToHttp().getRequest().auth = { userId: 'user_test_123' };
              return true;
            },
          },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.listen(0);
  });

  beforeEach(() => {
    allowAuth = true;
    jest.clearAllMocks();
    (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_test_123' });
    (createClerkClient as jest.Mock).mockReturnValue({
      users: { getUser: jest.fn().mockResolvedValue(clerkUser) },
    });
    service.syncClerkIdentity.mockResolvedValue({
      name: 'Yash Pal', email: 'yash@example.com', phone: '', city: '', about: '',
    });
    service.getMyProfile.mockResolvedValue({ name: 'Yash Pal', email: 'yash@example.com', phone: '', city: '', about: '' });
    service.saveMyProfile.mockImplementation(async (_id, profile) => profile);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('synchronizes verified Clerk identity through the versioned API', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/users/me`, { headers: { Authorization: 'Bearer test-token' } });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({
      id: 'user_test_123', name: 'Yash Pal', email: 'yash@example.com',
      imageUrl: 'https://images.example.com/user.png',
    }));
    expect(service.syncClerkIdentity).toHaveBeenCalledWith('user_test_123', { name: 'Yash Pal', email: 'yash@example.com' });
  });

  it('rejects unauthenticated profile requests', async () => {
    allowAuth = false;
    const response = await fetch(`${await app.getUrl()}/api/v1/users/me/profile`);
    expect(response.status).toBe(401);
    expect(service.getMyProfile).not.toHaveBeenCalled();
  });

  it('rejects invalid profile email and unknown DTO fields', async () => {
    const invalidEmail = await fetch(`${await app.getUrl()}/api/v1/users/me/profile`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    expect(invalidEmail.status).toBe(400);
    const unknownField = await fetch(`${await app.getUrl()}/api/v1/users/me/profile`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({ phone: '1234567890', isAdmin: true }),
    });
    expect(unknownField.status).toBe(400);
    expect(service.saveMyProfile).not.toHaveBeenCalled();
  });

  it('accepts a valid profile update for the authenticated Clerk subject', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/users/me/profile`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({ name: 'Test Buyer', city: 'Rudrapur' }),
    });
    expect(response.status).toBe(200);
    expect(service.saveMyProfile).toHaveBeenCalledWith('user_test_123', { name: 'Test Buyer', city: 'Rudrapur' });
  });
});
