import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyAuthGuard } from './property-auth.guard';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { PropertiesService } from './properties.service';

type AuthenticatedRequest = { authUserId?: string };

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(PropertyAuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() body: CreatePropertyDto) {
    if (!request.authUserId) throw new BadRequestException('Authenticated owner identity is missing');
    return this.propertiesService.create(request.authUserId, body);
  }

  @Get('mine')
  @UseGuards(PropertyAuthGuard)
  listMine(@Req() request: AuthenticatedRequest) {
    if (!request.authUserId) throw new BadRequestException('Authenticated owner identity is missing');
    return this.propertiesService.listMine(request.authUserId);
  }

  @Delete(':id')
  @UseGuards(PropertyAuthGuard)
  async removeMine(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    if (!request.authUserId) throw new BadRequestException('Authenticated owner identity is missing');
    const property = await this.propertiesService.removeMine(request.authUserId, id);
    if (!property) throw new NotFoundException('Property not found or not owned by this account');
    return { success: true, id };
  }

  @Get()
  list(@Query() query: ListPropertiesQueryDto) {
    if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
      throw new BadRequestException('minPrice must not exceed maxPrice');
    }
    return this.propertiesService.list(query);
  }

  @Get(':slugOrId')
  async findOne(@Param('slugOrId') slugOrId: string) {
    const property = await this.propertiesService.findPublicBySlugOrId(slugOrId);
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }
}
