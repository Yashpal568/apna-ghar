import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      auth?: { userId: string; claims: Record<string, unknown> };
    }>();
    const authorization = request.headers.authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');

    if (!token || !secretKey) {
      throw new UnauthorizedException(!secretKey ? 'Authentication is not configured' : 'Bearer token required');
    }

    try {
      const claims = await verifyToken(token, { secretKey });
      if (typeof claims.sub !== 'string' || !claims.sub) throw new Error('Token subject missing');
      request.auth = { userId: claims.sub, claims: claims as Record<string, unknown> };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
