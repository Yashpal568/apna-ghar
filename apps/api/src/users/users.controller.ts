import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
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

@Controller('users/me/profile')
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService, private readonly config: ConfigService) {}

  @Get()
  async getMyProfile(@Req() request: AuthenticatedRequest) {
    const identity = identityFromClaims(request.auth.claims);
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (secretKey) {
      try {
        // Read canonical identity fields from Clerk server-side rather than trusting browser-supplied identity.
        const clerk = createClerkClient({ secretKey });
        const user = await clerk.users.getUser(request.auth.userId);
        identity.name = [user.firstName, user.lastName].filter((part): part is string => Boolean(part?.trim())).join(' ') || identity.name;
        identity.email = user.primaryEmailAddress?.emailAddress?.trim() || identity.email;
      } catch {
        // A temporary Clerk API issue should not prevent users from viewing their saved profile.
      }
    }
    return this.users.getMyProfile(request.auth.userId, identity);
  }

  @Put()
  saveMyProfile(@Body() body: UpdateProfileDto, @Req() request: AuthenticatedRequest) {
    return this.users.saveMyProfile(request.auth.userId, body);
  }
}
