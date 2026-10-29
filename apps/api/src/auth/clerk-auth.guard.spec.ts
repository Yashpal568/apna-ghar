import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { ClerkAuthGuard } from './clerk-auth.guard';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));

describe('ClerkAuthGuard', () => {
  const get = jest.fn();
  const config = { get } as unknown as ConfigService;
  const guard = new ClerkAuthGuard(config);
  const request: { headers: Record<string, string | string[] | undefined>; auth?: { userId: string; claims: Record<string, unknown> } } = {
    headers: {},
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    request.headers = {};
    delete request.auth;
    get.mockReturnValue('sk_test_configured');
  });

  it('rejects requests without a bearer token', async () => {
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('fails closed when Clerk is not configured', async () => {
    request.headers.authorization = 'Bearer valid-token';
    get.mockReturnValue(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow('Authentication is not configured');
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('rejects invalid or expired tokens without exposing verification details', async () => {
    request.headers.authorization = 'Bearer invalid-token';
    (verifyToken as jest.Mock).mockRejectedValue(new Error('internal verifier details'));

    await expect(guard.canActivate(context)).rejects.toThrow('Invalid or expired authentication token');
  });

  it('rejects verified tokens without a subject', async () => {
    request.headers.authorization = 'Bearer no-subject';
    (verifyToken as jest.Mock).mockResolvedValue({ iss: 'clerk' });

    await expect(guard.canActivate(context)).rejects.toThrow('Invalid or expired authentication token');
  });

  it('attaches the verified Clerk subject and claims to the request', async () => {
    const claims = { sub: 'user_123', role: 'user' };
    request.headers.authorization = 'Bearer valid-token';
    (verifyToken as jest.Mock).mockResolvedValue(claims);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyToken).toHaveBeenCalledWith('valid-token', { secretKey: 'sk_test_configured' });
    expect(request.auth).toEqual({ userId: 'user_123', claims });
  });
});
