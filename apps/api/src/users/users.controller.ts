import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { UsersService } from './users.service';

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(500) about?: string;
}

type AuthenticatedRequest = { auth: { userId: string } };

@Controller('users/me/profile')
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  getMyProfile(@Body() _unused: unknown, @Req() request: AuthenticatedRequest) {
    return this.users.getMyProfile(request.auth.userId);
  }

  @Put()
  saveMyProfile(@Body() body: UpdateProfileDto, @Req() request: AuthenticatedRequest) {
    return this.users.saveMyProfile(request.auth.userId, body);
  }
}
