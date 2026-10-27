import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { PropertiesService } from './properties.service';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  list(@Query() query: ListPropertiesQueryDto) {
    if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
      throw new (require('@nestjs/common').BadRequestException)('minPrice must not exceed maxPrice');
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
