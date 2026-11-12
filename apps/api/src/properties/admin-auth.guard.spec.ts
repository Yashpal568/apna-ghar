import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { AdminAuthGuard } from './admin-auth.guard';
import { UsersService } from '../users/users.service';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));

describe('AdminAuthGuard', () => {
  const get = jest.fn();
  const config = { get } as unknown as ConfigService;
  const usersService = { findByClerkUserId: jest.fn() };
  const guard = new AdminAuthGuard(config, usersService as unknown as UsersService);
  let request: { headers: Record<string, string | undefined>; authUserId?: string; auth?: { userId: string } };

  const context = () =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    request = { headers: {} };
    get.mockImplementation((key: string) => (key === 'CLERK_SECRET_KEY' ? 'sk_test_configured' : 'user_admin'));
    usersService.findByClerkUserId.mockResolvedValue(null);
  });

  it('rejects requests without a bearer token', async () => {
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('rejects invalid tokens', async () => {
    request.headers.authorization = 'Bearer invalid';
    (verifyToken as jest.Mock).mockRejectedValue(new Error('invalid token'));
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('denies a valid Clerk user who is not on the admin allowlist and has no ADMIN role in DB', async () => {
    request.headers.authorization = 'Bearer valid-user';
    get.mockImplementation((key: string) => (key === 'CLERK_SECRET_KEY' ? 'sk_test_configured' : 'another_admin'));
    (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_regular' });
    usersService.findByClerkUserId.mockResolvedValue({ role: 'USER' });

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(ForbiddenException);
    expect(request.authUserId).toBe('user_regular');
  });

  it('allows a verified user explicitly listed as an admin in ADMIN_CLERK_USER_IDS', async () => {
    request.headers.authorization = 'Bearer valid-admin';
    (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_admin' });

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(request.authUserId).toBe('user_admin');
  });

  it('allows a verified user who has role ADMIN in MongoDB even if not in allowlist', async () => {
    request.headers.authorization = 'Bearer db-admin';
    get.mockImplementation((key: string) => (key === 'CLERK_SECRET_KEY' ? 'sk_test_configured' : ''));
    (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_db_admin' });
    usersService.findByClerkUserId.mockResolvedValue({ role: 'ADMIN' });

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(request.authUserId).toBe('user_db_admin');
  });
});
