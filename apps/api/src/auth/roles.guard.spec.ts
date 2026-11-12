import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../users/schemas/user-profile.schema';
import { UsersService } from '../users/users.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let usersService: { findByClerkUserId: jest.Mock };
  let config: { get: jest.Mock };
  let request: { auth?: { userId: string }; authUserId?: string };

  const context = () => ({
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector = { getAllAndOverride: jest.fn() };
    usersService = { findByClerkUserId: jest.fn() };
    config = { get: jest.fn(() => '') };
    request = { auth: { userId: 'user_123' } };
    guard = new RolesGuard(reflector as unknown as Reflector, usersService as unknown as UsersService, config as unknown as ConfigService);
  });

  it('allows access when no roles are required on the endpoint', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    await expect(guard.canActivate(context())).resolves.toBe(true);
  });

  it('rejects unauthenticated requests if roles are required', async () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
    request = {};
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows ADMIN users regardless of required role', async () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
    config.get.mockReturnValue('user_123,admin_456');
    await expect(guard.canActivate(context())).resolves.toBe(true);
  });

  it('allows user when their profile role matches the required role', async () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
    usersService.findByClerkUserId.mockResolvedValue({ role: UserRole.OWNER });
    await expect(guard.canActivate(context())).resolves.toBe(true);
  });

  it('rejects user when their profile role does not match the required role', async () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OWNER]);
    usersService.findByClerkUserId.mockResolvedValue({ role: UserRole.USER });
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(ForbiddenException);
  });
});

