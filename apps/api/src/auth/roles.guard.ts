import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '../users/schemas/user-profile.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      auth?: { userId: string };
      authUserId?: string;
    }>();
    const userId = request.auth?.userId || request.authUserId;
    if (!userId) {
      throw new ForbiddenException('User identity is required for role verification.');
    }

    const adminIds = (this.config.get<string>('ADMIN_CLERK_USER_IDS') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    let effectiveRole: UserRole = UserRole.USER;
    if (adminIds.includes(userId)) {
      effectiveRole = UserRole.ADMIN;
    } else {
      const profile = await this.usersService.findByClerkUserId(userId);
      effectiveRole = (profile?.role as UserRole) || UserRole.USER;
    }

    if (effectiveRole === UserRole.ADMIN) {
      return true; // Admins have super-user privileges across role-gated endpoints
    }

    if (!requiredRoles.includes(effectiveRole)) {
      throw new ForbiddenException(`Access denied. Required role: ${requiredRoles.join(' or ')}.`);
    }

    return true;
  }
}

