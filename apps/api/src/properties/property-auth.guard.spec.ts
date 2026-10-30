import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { PropertyAuthGuard } from './property-auth.guard';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));

describe('PropertyAuthGuard', () => {
  const get = jest.fn();
  const config = { get } as unknown as ConfigService;
  const guard = new PropertyAuthGuard(config);
  const request: {
    headers: Record<string, string | string[] | undefined>;
    authUserId?: string;
    auth?: { userId: string; claims: Record<string, unknown> };
  } = { headers: {} };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    request.headers = {};
    delete request.authUserId;
    delete request.auth;
    get.mockReturnValue('sk_test_configured');
  });

  it('rejects requests without a bearer token using the shared verifier', async () => {
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it('maps the verified Clerk subject to the property owner identity field', async () => {
    request.headers.authorization = 'Bearer valid-token';
    (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_owner', role: 'user' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.authUserId).toBe('user_owner');
    expect(verifyToken).toHaveBeenCalledWith('valid-token', { secretKey: 'sk_test_configured' });
  });
});
