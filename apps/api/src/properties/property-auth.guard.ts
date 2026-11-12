import { ExecutionContext, ForbiddenException, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { UsersService } from '../users/users.service';

type AuthenticatedRequest = {
  authUserId?: string;
  auth?: { userId: string; claims: Record<string, unknown> };
};

/**
 * Reuses the canonical Clerk token verifier and exposes the verified subject
 * under the legacy authUserId field used by property controllers, while
 * enforcing account suspension checks.
 */
@Injectable()
export class PropertyAuthGuard extends ClerkAuthGuard {
  constructor(
    config: ConfigService,
    @Optional() private readonly usersService?: UsersService,
  ) {
    super(config);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.authUserId = request.auth?.userId;

    if (request.authUserId && this.usersService) {
      const profile = await this.usersService.findByClerkUserId(request.authUserId);
      if (profile?.accountStatus === 'suspended') {
        throw new ForbiddenException('Your account has been suspended by an administrator.');
      }
    }
    return true;
  }
}
