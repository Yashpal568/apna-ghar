import { Controller, Get, Post, Delete, Param, Req, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { PropertyAuthGuard } from './property-auth.guard';
import { SavedPropertiesService } from './saved-properties.service';

type AuthenticatedRequest = { authUserId?: string };

@Controller('saved-properties')
@UseGuards(PropertyAuthGuard)
export class SavedPropertiesController {
  constructor(private readonly service: SavedPropertiesService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    if (!request.authUserId) throw new BadRequestException('Authenticated user identity is missing');
    return this.service.list(request.authUserId);
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
