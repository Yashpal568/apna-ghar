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

type AuthenticatedRequest = { auth: { userId: string } };

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
      return { id: request.auth.userId, name: profile.name, email: profile.email, phone: profile.phone, city: profile.city, about: profile.about, imageUrl: identity.imageUrl };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new ServiceUnavailableException('Could not synchronize your account from the identity provider. Please retry.');
    }
  }

  @Get('me/profile')
  getMyProfile(@Req() request: AuthenticatedRequest) {
    return this.users.getMyProfile(request.auth.userId);
  }

  @Put('me/profile')
  saveMyProfile(@Body() body: UpdateProfileDto, @Req() request: AuthenticatedRequest) {
    return this.users.saveMyProfile(request.auth.userId, body);
  }
}
