import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { ClerkAuthGuard } from './clerk-auth.guard';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));

describe('ClerkAuthGuard', () => {
  const verify = verifyToken as jest.Mock;
  let secret: string | undefined;
  let guard: ClerkAuthGuard;
  let request: { headers: Record<string, string>; auth?: { userId: string; claims: Record<string, unknown> } };

  const context = () => ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    secret = 'test-secret';
    request = { headers: {} };
    const config = { get: jest.fn(() => secret) } as unknown as ConfigService;
    guard = new ClerkAuthGuard(config);
  });

  it('rejects requests without a bearer token', async () => {
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verify).not.toHaveBeenCalled();
  });

  it('fails closed when the Clerk secret is not configured', async () => {
    secret = undefined;
    request.headers.authorization = 'Bearer valid-token';
    await expect(guard.canActivate(context())).rejects.toThrow('Authentication is not configured');
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects invalid or expired tokens', async () => {
    request.headers.authorization = 'Bearer invalid-token';
    verify.mockRejectedValue(new Error('invalid token'));
    await expect(guard.canActivate(context())).rejects.toThrow('Invalid or expired authentication token');
  });

  it('attaches only the verified token subject and claims to the request', async () => {
    request.headers.authorization = 'Bearer valid-token';
    verify.mockResolvedValue({ sub: 'user_verified', email: 'verified@example.com' });
    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith('valid-token', { secretKey: 'test-secret' });
    expect(request.auth).toEqual({
      userId: 'user_verified',
      claims: { sub: 'user_verified', email: 'verified@example.com' },
    });
  });

  it('rejects a verified token without a subject', async () => {
    request.headers.authorization = 'Bearer missing-subject';
    verify.mockResolvedValue({ email: 'verified@example.com' });
    await expect(guard.canActivate(context())).rejects.toThrow('Invalid or expired authentication token');
  });
});
