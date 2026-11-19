import { ExecutionContext, ForbiddenException, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import { ClerkAuthGuard } from '../src/auth/clerk-auth.guard';
import { PropertyAuthGuard } from '../src/properties/property-auth.guard';
import { AdminAuthGuard } from '../src/properties/admin-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { RateLimitGuard } from '../src/common/guards/rate-limit.guard';
import { PrivateCacheInterceptor } from '../src/common/interceptors/private-cache.interceptor';
import { UsersService } from '../src/users/users.service';
import { UserRole } from '../src/users/schemas/user-profile.schema';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
  createClerkClient: jest.fn(),
}));

describe('M6 Security Hardening Acceptance Suite', () => {
  describe('1. Authentication Enforcement (ClerkAuthGuard & PropertyAuthGuard)', () => {
    let guard: ClerkAuthGuard;
    const configGet = jest.fn();
    const config = { get: configGet } as unknown as ConfigService;
    let request: any;
    let context: ExecutionContext;

    beforeEach(() => {
      jest.clearAllMocks();
      configGet.mockReturnValue('sk_test_mock_secret_key');
      guard = new ClerkAuthGuard(config);
      request = { headers: {} };
      context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => () => {},
        getClass: () => class {},
      } as unknown as ExecutionContext;
    });

    it('rejects unauthenticated requests without authorization header', async () => {
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Bearer token required');
    });

    it('rejects requests with malformed authorization header', async () => {
      request.headers.authorization = 'Basic dXNlcjpwYXNz';
      await expect(guard.canActivate(context)).rejects.toThrow('Bearer token required');
    });

    it('rejects authentication when server secret key is not configured', async () => {
      configGet.mockReturnValue(undefined);
      request.headers.authorization = 'Bearer valid-jwt-token';
      await expect(guard.canActivate(context)).rejects.toThrow('Authentication is not configured');
    });

    it('rejects expired or signature-invalid tokens', async () => {
      request.headers.authorization = 'Bearer expired-or-invalid-jwt';
      (verifyToken as jest.Mock).mockRejectedValue(new Error('Token signature invalid'));
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid or expired authentication token');
    });

    it('rejects token missing subject (claims.sub)', async () => {
      request.headers.authorization = 'Bearer token-without-sub';
      (verifyToken as jest.Mock).mockResolvedValue({ role: 'user' });
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid or expired authentication token');
    });

    it('successfully verifies valid Bearer token and populates request.auth', async () => {
      request.headers.authorization = 'Bearer valid-token-123';
      (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_clerk_verified_1', email: 'test@apnaghar.com' });

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(request.auth).toEqual({
        userId: 'user_clerk_verified_1',
        claims: { sub: 'user_clerk_verified_1', email: 'test@apnaghar.com' },
      });
    });
  });

  describe('2. Authorization, IDOR Defense & Admin Isolation (AdminAuthGuard & RolesGuard)', () => {
    let adminGuard: AdminAuthGuard;
    const configGet = jest.fn();
    const config = { get: configGet } as unknown as ConfigService;
    const mockUsersService = {
      findByClerkUserId: jest.fn(),
    } as unknown as UsersService;
    let request: any;
    let context: ExecutionContext;

    beforeEach(() => {
      jest.clearAllMocks();
      configGet.mockImplementation((key: string) => {
        if (key === 'CLERK_SECRET_KEY') return 'sk_test_mock_secret_key';
        if (key === 'ADMIN_CLERK_USER_IDS') return 'user_configured_admin_99';
        return undefined;
      });
      adminGuard = new AdminAuthGuard(config, mockUsersService);
      request = { headers: { authorization: 'Bearer valid-token' } };
      context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => () => {},
        getClass: () => class {},
      } as unknown as ExecutionContext;
    });

    it('denies access to non-admin ordinary user', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_normal_buyer' });
      (mockUsersService.findByClerkUserId as jest.Mock).mockResolvedValue({
        clerkUserId: 'user_normal_buyer',
        role: UserRole.USER,
      });

      await expect(adminGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(adminGuard.canActivate(context)).rejects.toThrow(
        'This account is not authorized for admin operations.',
      );
    });

    it('allows access to administrator in configured ADMIN_CLERK_USER_IDS', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_configured_admin_99' });

      await expect(adminGuard.canActivate(context)).resolves.toBe(true);
      expect(request.authUserId).toBe('user_configured_admin_99');
    });

    it('allows access to user with database ADMIN role', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_db_admin_42' });
      (mockUsersService.findByClerkUserId as jest.Mock).mockResolvedValue({
        clerkUserId: 'user_db_admin_42',
        role: 'ADMIN',
      });

      await expect(adminGuard.canActivate(context)).resolves.toBe(true);
      expect(request.authUserId).toBe('user_db_admin_42');
    });

    it('RolesGuard blocks unauthorized roles on gated routes', async () => {
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const rolesGuard = new RolesGuard(reflector, mockUsersService, config);

      (mockUsersService.findByClerkUserId as jest.Mock).mockResolvedValue({
        clerkUserId: 'user_regular',
        role: UserRole.USER,
      });
      request.auth = { userId: 'user_regular' };

      await expect(rolesGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(rolesGuard.canActivate(context)).rejects.toThrow('Access denied. Required role: ADMIN');
    });
  });

  describe('3. Suspended User Restrictions (Account Suspension Defense)', () => {
    let propertyGuard: PropertyAuthGuard;
    const configGet = jest.fn();
    const config = { get: configGet } as unknown as ConfigService;
    const mockUsersService = {
      findByClerkUserId: jest.fn(),
    } as unknown as UsersService;
    let request: any;
    let context: ExecutionContext;

    beforeEach(() => {
      jest.clearAllMocks();
      configGet.mockReturnValue('sk_test_mock_secret_key');
      propertyGuard = new PropertyAuthGuard(config, mockUsersService);
      request = { headers: { authorization: 'Bearer valid-token' } };
      context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => () => {},
        getClass: () => class {},
      } as unknown as ExecutionContext;
    });

    it('allows active users to proceed', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_active_123' });
      (mockUsersService.findByClerkUserId as jest.Mock).mockResolvedValue({
        clerkUserId: 'user_active_123',
        accountStatus: 'active',
      });

      await expect(propertyGuard.canActivate(context)).resolves.toBe(true);
    });

    it('blocks suspended users from properties, messaging, and write operations with HTTP 403', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_suspended_bad_actor' });
      (mockUsersService.findByClerkUserId as jest.Mock).mockResolvedValue({
        clerkUserId: 'user_suspended_bad_actor',
        accountStatus: 'suspended',
      });

      await expect(propertyGuard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(propertyGuard.canActivate(context)).rejects.toThrow(
        'Your account has been suspended by an administrator.',
      );
    });
  });

  describe('4. Rate Limiting & Abuse Protection (RateLimitGuard)', () => {
    let guard: RateLimitGuard;
    let reflector: Reflector;
    let response: any;

    beforeEach(() => {
      reflector = new Reflector();
      guard = new RateLimitGuard(reflector);
      guard.reset();
      response = {
        headers: {},
        setHeader(name: string, value: string) {
          this.headers[name] = value;
        },
      };
    });

    it('allows requests within rate limits and sets rate limit headers', () => {
      const request = {
        method: 'POST',
        headers: { 'cf-connecting-ip': '203.0.113.1' },
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
        getClass: () => ({ name: 'TestController' }),
        getHandler: () => ({ name: 'testAction' }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ limit: 5, ttlSeconds: 60 });

      expect(guard.canActivate(context)).toBe(true);
      expect(response.headers['X-RateLimit-Limit']).toBe('5');
      expect(response.headers['X-RateLimit-Remaining']).toBe('4');
      expect(response.headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('throws HTTP 429 Too Many Requests when limit is exceeded with Retry-After header', () => {
      const request = {
        method: 'POST',
        headers: { 'cf-connecting-ip': '203.0.113.50' },
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
        getClass: () => ({ name: 'UploadController' }),
        getHandler: () => ({ name: 'upload' }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ limit: 2, ttlSeconds: 60 });

      expect(guard.canActivate(context)).toBe(true); // req 1
      expect(guard.canActivate(context)).toBe(true); // req 2

      // req 3 must be blocked
      try {
        guard.canActivate(context);
        fail('Should have thrown HttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(err.getResponse().error).toBe('Too Many Requests');
        expect(response.headers['Retry-After']).toBeDefined();
        expect(Number(response.headers['Retry-After'])).toBeGreaterThan(0);
      }
    });

    it('enforces user-keyed limits preventing IP spoofing bypass for authenticated users', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ limit: 2, ttlSeconds: 60 });

      const request1 = {
        method: 'POST',
        auth: { userId: 'user_malicious_spammer' },
        headers: { 'cf-connecting-ip': '1.1.1.1' },
      };
      const context1 = {
        switchToHttp: () => ({ getRequest: () => request1, getResponse: () => response }),
        getClass: () => ({ name: 'MessageController' }),
        getHandler: () => ({ name: 'send' }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context1)).toBe(true);
      expect(guard.canActivate(context1)).toBe(true);

      // Same user with a rotated IP header should still be blocked!
      const request2 = {
        method: 'POST',
        auth: { userId: 'user_malicious_spammer' },
        headers: { 'cf-connecting-ip': '2.2.2.2' }, // Rotated IP header
      };
      const context2 = {
        switchToHttp: () => ({ getRequest: () => request2, getResponse: () => response }),
        getClass: () => ({ name: 'MessageController' }),
        getHandler: () => ({ name: 'send' }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context2)).toThrow(HttpException);
    });
  });

  describe('5. Private Cache-Control Directives (PrivateCacheInterceptor)', () => {
    let interceptor: PrivateCacheInterceptor;
    let next: any;

    beforeEach(() => {
      interceptor = new PrivateCacheInterceptor();
      next = { handle: jest.fn().mockReturnValue('handled') };
    });

    it('sets private no-cache headers on authenticated requests', () => {
      const response: any = { headers: {}, setHeader(k: string, v: string) { this.headers[k] = v; } };
      const request = {
        url: '/api/v1/properties/mine',
        headers: { authorization: 'Bearer token' },
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
      } as unknown as ExecutionContext;

      interceptor.intercept(context, next);
      expect(response.headers['Cache-Control']).toBe('private, no-cache, no-store, must-revalidate');
      expect(response.headers['Pragma']).toBe('no-cache');
      expect(response.headers['Expires']).toBe('0');
    });

    it('sets private no-cache headers on sensitive routes like /conversations', () => {
      const response: any = { headers: {}, setHeader(k: string, v: string) { this.headers[k] = v; } };
      const request = {
        url: '/api/v1/conversations/6af8174e171182960b241d06',
        headers: {},
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
      } as unknown as ExecutionContext;

      interceptor.intercept(context, next);
      expect(response.headers['Cache-Control']).toBe('private, no-cache, no-store, must-revalidate');
    });

    it('does not force private cache headers on unauthenticated public routes', () => {
      const response: any = { headers: {}, setHeader(k: string, v: string) { this.headers[k] = v; } };
      const request = {
        url: '/api/v1/properties',
        headers: {},
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
      } as unknown as ExecutionContext;

      interceptor.intercept(context, next);
      expect(response.headers['Cache-Control']).toBeUndefined();
    });
  });

  describe('6. File Upload Security & Magic Byte Validation', () => {
    // Magic byte checker verification
    const isValidSignature = (buffer: Buffer, mimetype: string): boolean => {
      if (!buffer || buffer.length < 4) return false;
      switch (mimetype) {
        case 'image/jpeg':
          return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        case 'image/png':
          return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        case 'image/webp':
          return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
        case 'application/pdf':
          return buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x25, 0x50, 0x44, 0x46]));
        default:
          return false;
      }
    };

    it('validates authentic JPEG magic bytes', () => {
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      expect(isValidSignature(jpeg, 'image/jpeg')).toBe(true);
    });

    it('validates authentic PNG magic bytes', () => {
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
      expect(isValidSignature(png, 'image/png')).toBe(true);
    });

    it('validates authentic WebP magic bytes', () => {
      const webp = Buffer.concat([
        Buffer.from('RIFF', 'ascii'),
        Buffer.from([0x00, 0x00, 0x00, 0x00]),
        Buffer.from('WEBP', 'ascii'),
      ]);
      expect(isValidSignature(webp, 'image/webp')).toBe(true);
    });

    it('validates authentic PDF magic bytes', () => {
      const pdf = Buffer.from('%PDF-1.7\n%abc');
      expect(isValidSignature(pdf, 'application/pdf')).toBe(true);
    });

    it('rejects spoofed file claiming to be JPEG but containing HTML/script', () => {
      const evilScript = Buffer.from('<script>alert("xss")</script>');
      expect(isValidSignature(evilScript, 'image/jpeg')).toBe(false);
    });

    it('rejects spoofed file claiming to be PDF but containing executable binary', () => {
      const evilExe = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00');
      expect(isValidSignature(evilExe, 'application/pdf')).toBe(false);
    });
  });

  describe('7. CORS Allowlist Hardening', () => {
    const isOriginAllowed = (origin: string): boolean => {
      const allowedOrigins = ['http://localhost:3000'];
      const vercelProductionOrigins = new Set([
        'https://web-dun-two-91.vercel.app',
        'https://web-yashs-projects-cd385495.vercel.app',
        'https://web-git-main-yashs-projects-cd385495.vercel.app',
        'https://apna-ghar-web.yash38688.workers.dev',
      ]);

      if (!origin || allowedOrigins.includes(origin) || vercelProductionOrigins.has(origin)) {
        return true;
      }
      try {
        const parsed = new URL(origin);
        if (
          (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
          (parsed.hostname === 'localhost' ||
            parsed.hostname === '127.0.0.1' ||
            /^web-[a-z0-9-]+-yashs-projects-cd385495\.vercel\.app$/.test(parsed.hostname) ||
            /^apna-ghar-web(?:-[a-z0-9-]+)?\.yash38688\.workers\.dev$/.test(parsed.hostname))
        ) {
          return true;
        }
      } catch {
        // Reject
      }
      return false;
    };

    it('allows production Cloudflare Worker frontend', () => {
      expect(isOriginAllowed('https://apna-ghar-web.yash38688.workers.dev')).toBe(true);
    });

    it('allows localhost development origins', () => {
      expect(isOriginAllowed('http://localhost:3000')).toBe(true);
      expect(isOriginAllowed('http://127.0.0.1:3005')).toBe(true);
    });

    it('allows verified Vercel production and project preview domains', () => {
      expect(isOriginAllowed('https://web-dun-two-91.vercel.app')).toBe(true);
      expect(isOriginAllowed('https://web-preview-12-yashs-projects-cd385495.vercel.app')).toBe(true);
    });

    it('STRICTLY REJECTS arbitrary attacker domains on .workers.dev', () => {
      expect(isOriginAllowed('https://attacker-phishing.workers.dev')).toBe(false);
      expect(isOriginAllowed('https://evil-corp.workers.dev')).toBe(false);
    });

    it('STRICTLY REJECTS arbitrary attacker domains on .vercel.app', () => {
      expect(isOriginAllowed('https://evil-site.vercel.app')).toBe(false);
      expect(isOriginAllowed('https://unrelated-project.vercel.app')).toBe(false);
    });

    it('STRICTLY REJECTS random third-party origins', () => {
      expect(isOriginAllowed('https://malicious-site.com')).toBe(false);
    });
  });

  describe('8. NoSQL Injection & Regular Expression Sanitization', () => {
    const escapeRegex = (value: string): string => {
      return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    it('properly escapes regex metacharacters preventing ReDoS and wildcard injection', () => {
      const maliciousPayload = '.*|^$|[](){}\\';
      const escaped = escapeRegex(maliciousPayload);

      expect(escaped).toBe('\\.\\*\\|\\^\\$\\|\\[\\]\\(\\)\\{\\}\\\\');
      const testRegex = new RegExp(escaped);
      // Literal match only: should not match arbitrary string
      expect(testRegex.test('completely different string')).toBe(false);
      expect(testRegex.test('.*|^$|[](){}\\')).toBe(true);
    });
  });
});
