import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; authUserId?: string }>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (!token || !secretKey) throw new UnauthorizedException('Admin sign-in is required.');
    try {
      const claims = await verifyToken(token, { secretKey });
      if (typeof claims.sub !== 'string' || !claims.sub) throw new Error('Missing subject');
      request.authUserId = claims.sub;
      const allowlist = (this.config.get<string>('ADMIN_CLERK_USER_IDS') || '').split(',').map(value => value.trim()).filter(Boolean);
      if (!allowlist.includes(claims.sub)) throw new ForbiddenException('This account is not authorized for admin operations.');
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Your session is invalid or expired. Please sign in again.');
    }
  }
}
