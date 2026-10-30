import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

type AuthenticatedRequest = {
  authUserId?: string;
  auth?: { userId: string; claims: Record<string, unknown> };
};

/**
 * Reuses the canonical Clerk token verifier and exposes the verified subject
 * under the legacy authUserId field used by property controllers.
 */
@Injectable()
export class PropertyAuthGuard extends ClerkAuthGuard {
  constructor(config: ConfigService) {
    super(config);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.authUserId = request.auth?.userId;
    return true;
  }
}
