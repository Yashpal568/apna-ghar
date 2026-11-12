import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { PropertyAuthGuard } from './property-auth.guard';
import { SavedPropertiesService } from './saved-properties.service';

type AuthenticatedRequest = { authUserId?: string };

export class SyncSavedPropertiesDto {
  @IsArray()
  @IsString({ each: true })
  propertyIds!: string[];
}

@Controller('saved-properties')
@UseGuards(PropertyAuthGuard)
export class SavedPropertiesController {
  constructor(private readonly service: SavedPropertiesService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    if (!request.authUserId) throw new BadRequestException('Authenticated user identity is missing');
    return this.service.list(request.authUserId);
  }

  @Post('sync')
  async sync(@Req() request: AuthenticatedRequest, @Body() body: SyncSavedPropertiesDto) {
    if (!request.authUserId) throw new BadRequestException('Authenticated user identity is missing');
    return this.service.sync(request.authUserId, body.propertyIds || []);
  }

  @Get('check/:propertyId')
  async isSaved(@Req() request: AuthenticatedRequest, @Param('propertyId') propertyId: string) {
    if (!request.authUserId) throw new BadRequestException('Authenticated user identity is missing');
    const isSaved = await this.service.isSaved(request.authUserId, propertyId);
    return { propertyId, isSaved };
  }

  @Post(':propertyId')
  async add(@Req() request: AuthenticatedRequest, @Param('propertyId') propertyId: string) {
    if (!request.authUserId) throw new BadRequestException('Authenticated user identity is missing');
    const result = await this.service.add(request.authUserId, propertyId);
    if (!result) throw new NotFoundException('Published property not found');
    return result;
  }

  @Delete(':propertyId')
  remove(@Req() request: AuthenticatedRequest, @Param('propertyId') propertyId: string) {
    if (!request.authUserId) throw new BadRequestException('Authenticated user identity is missing');
    return this.service.remove(request.authUserId, propertyId);
  }
}
