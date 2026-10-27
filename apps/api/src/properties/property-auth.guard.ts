import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';

type AuthenticatedRequest = Request & { authUserId?: string };

@Injectable()
export class PropertyAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (!token || !secretKey) throw new UnauthorizedException('Sign in is required to publish a property.');
    try {
      const claims = await verifyToken(token, { secretKey });
      if (typeof claims.sub !== 'string' || !claims.sub) throw new Error('Missing subject');
      request.authUserId = claims.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Your session is invalid or expired. Please sign in again.');
    }
  }
}
