import { Body, Controller, Get, Put, Req, ServiceUnavailableException, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';
import { IsEmail, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { UsersService } from './users.service';

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @ValidateIf((_object, value) => value !== '') @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(500) about?: string;
}

type AuthenticatedRequest = { auth: { userId: string; claims?: Record<string, unknown> } };

function claimText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function identityFromClaims(claims: Record<string, unknown> = {}) {
  const name = claimText(claims.name) || [claimText(claims.first_name), claimText(claims.last_name)].filter(Boolean).join(' ');
  const email = claimText(claims.email) || claimText(claims.email_address);
  return { name, email };
}

@Controller('users')
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService, private readonly config: ConfigService) {}

  @Get('me')
  async getMyIdentity(@Req() request: AuthenticatedRequest) {
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) throw new UnauthorizedException('Authentication is not configured.');
    try {
      const clerk = createClerkClient({ secretKey });
      const identity = await clerk.users.getUser(request.auth.userId);
      const name = [identity.firstName, identity.lastName].filter(Boolean).join(' ').trim();
      const email = identity.primaryEmailAddress?.emailAddress || '';
      const profile = await this.users.syncClerkIdentity(request.auth.userId, { name, email });
      return {
        id: request.auth.userId,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        city: profile.city,
        about: profile.about,
        imageUrl: identity.imageUrl,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new ServiceUnavailableException('Could not synchronize your account from the identity provider. Please retry.');
    }
  }

  @Get('me/profile')
  async getMyProfile(@Req() request: AuthenticatedRequest) {
    const userId = request.auth.userId;
    const fromClaims = identityFromClaims(request.auth.claims);
    const profile = await this.users.getMyProfile(userId, fromClaims);
    if (profile.name && profile.email) return profile;

    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) return profile;
    try {
      // Only call Clerk's server API when the persisted profile is missing identity fields.
      const clerk = createClerkClient({ secretKey });
      const user = await clerk.users.getUser(userId);
      const identity = {
        name: [user.firstName, user.lastName].filter((part): part is string => Boolean(part?.trim())).join(' ') || fromClaims.name,
        email: user.primaryEmailAddress?.emailAddress?.trim() || fromClaims.email,
      };
      return this.users.getMyProfile(userId, identity);
    } catch {
      // A temporary Clerk API issue should not prevent users from viewing their saved profile.
      return profile;
    }
  }

  @Put('me/profile')
  saveMyProfile(@Body() body: UpdateProfileDto, @Req() request: AuthenticatedRequest) {
    return this.users.saveMyProfile(request.auth.userId, body);
  }
}
