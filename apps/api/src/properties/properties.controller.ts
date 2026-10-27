import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
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
