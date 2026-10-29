import { UnauthorizedException } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { ClerkAuthGuard } from './clerk-auth.guard';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));

describe('ClerkAuthGuard', () => {
  const verify = verifyToken as jest.Mock;
  const config = { get: jest.fn() };
  const request: { headers: Record<string, string>; auth?: { userId: string; claims: Record<string, unknown> } } = { headers: {} };
  const context = { switchToHttp: () => ({ getRequest: () => request }) } as never;
  let guard: ClerkAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    request.headers = {};
    delete request.auth;
    config.get.mockReturnValue('sk_test_example');
    guard = new ClerkAuthGuard(config as never);
  });

  it('rejects missing bearer tokens', async () => {
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects when the server secret is missing', async () => {
    config.get.mockReturnValue(undefined);
    request.headers.authorization = 'Bearer token';
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the verified Clerk subject to the request', async () => {
    request.headers.authorization = 'Bearer signed-token';
    verify.mockResolvedValue({ sub: 'user_verified', email: 'not-trusted-for-authz@example.com' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith('signed-token', { secretKey: 'sk_test_example' });
    expect(request.auth?.userId).toBe('user_verified');
  });

  it('rejects expired or malformed tokens', async () => {
    request.headers.authorization = 'Bearer invalid';
    verify.mockRejectedValue(new Error('expired'));
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
