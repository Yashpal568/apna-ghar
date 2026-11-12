import { ExecutionContext, ForbiddenException, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { UsersService } from '../users/users.service';

type AuthenticatedRequest = {
  authUserId?: string;
  auth?: { userId: string; claims: Record<string, unknown> };
};

/**
 * Admin authorization builds on the same verified Clerk identity as user and
 * property routes, checking both the server-side admin allowlist and the user role.
 */
@Injectable()
export class AdminAuthGuard extends ClerkAuthGuard {
  constructor(
    config: ConfigService,
    @Optional() private readonly usersService?: UsersService,
  ) {
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

    let isAdmin = allowlist.includes(userId);
    if (!isAdmin && this.usersService) {
      const profile = await this.usersService.findByClerkUserId(userId);
      if (profile?.role === 'ADMIN') {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      throw new ForbiddenException('This account is not authorized for admin operations.');
    }
    return true;
  }
}
