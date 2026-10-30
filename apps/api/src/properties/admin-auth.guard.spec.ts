import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { AdminAuthGuard } from './admin-auth.guard';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));

describe('AdminAuthGuard', () => {
  const get = jest.fn();
  const config = { get } as unknown as ConfigService;
  const guard = new AdminAuthGuard(config);
  const request: { headers: Record<string, string | undefined>; authUserId?: string } = { headers: {} };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    request.headers = {};
    delete request.authUserId;
    get.mockImplementation((key: string) => key === 'CLERK_SECRET_KEY' ? 'sk_test_configured' : 'user_admin');
  });

  it('rejects requests without a bearer token', async () => {
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('rejects invalid tokens', async () => {
    request.headers.authorization = 'Bearer invalid';
    (verifyToken as jest.Mock).mockRejectedValue(new Error('invalid token'));
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('denies a valid Clerk user who is not on the admin allowlist', async () => {
    request.headers.authorization = 'Bearer valid-user';
    get.mockImplementation((key: string) => key === 'CLERK_SECRET_KEY' ? 'sk_test_configured' : 'another_admin');
    (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_regular' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(request.authUserId).toBe('user_regular');
  });

  it('allows a verified user explicitly listed as an admin', async () => {
    request.headers.authorization = 'Bearer valid-admin';
    (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_admin' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.authUserId).toBe('user_admin');
  });
});
