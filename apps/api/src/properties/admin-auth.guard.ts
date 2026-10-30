import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

type AuthenticatedRequest = {
  authUserId?: string;
  auth?: { userId: string; claims: Record<string, unknown> };
};

/**
 * Admin authorization builds on the same verified Clerk identity as user and
 * property routes, then applies the server-side admin allowlist.
 */
@Injectable()
export class AdminAuthGuard extends ClerkAuthGuard {
  constructor(config: ConfigService) {
    super(config);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.auth?.userId;
    if (!userId) throw new ForbiddenException('Verified user identity is missing.');

    request.authUserId = userId;
    const allowlist = (this.config.get<string>('ADMIN_CLERK_USER_IDS') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (!allowlist.includes(userId)) {
      throw new ForbiddenException('This account is not authorized for admin operations.');
    }
    return true;
  }
}
