import { ExecutionContext, ForbiddenException, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { UsersService } from '../users/users.service';
import { ALLOW_SIGNED_QUERY_KEY } from '../common/decorators/allow-signed-query.decorator';

type AuthenticatedRequest = {
  authUserId?: string;
  auth?: { userId: string; claims: Record<string, unknown> };
};

/**
 * Reuses the canonical Clerk token verifier and exposes the verified subject
 * under the legacy authUserId field used by property controllers, while
 * enforcing account suspension checks. Supports signed query URLs for private attachments.
 */
@Injectable()
export class PropertyAuthGuard extends ClerkAuthGuard {
  constructor(
    config: ConfigService,
    @Optional() private readonly usersService?: UsersService,
    @Optional() private readonly reflector?: Reflector,
  ) {
    super(config);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isSignedQueryAllowed = this.reflector?.getAllAndOverride<boolean>(ALLOW_SIGNED_QUERY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<any>();
    const hasAuth = !!request.headers?.authorization;
    const hasSignedQuery = !!(request.query?.expires && request.query?.sig);

    // If signed query is allowed and signed query parameters are provided without auth header,
    // let controller handler validate cryptographic signature and expiry
    if (isSignedQueryAllowed && !hasAuth && hasSignedQuery) {
      return true;
    }

    await super.canActivate(context);
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
