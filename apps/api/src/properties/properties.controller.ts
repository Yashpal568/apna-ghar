import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

type AuthenticatedRequest = Request & { auth: { userId: string; claims: Record<string, unknown> } };

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  list(@Query() query: ListPropertiesQueryDto) {
    if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
      throw new BadRequestException('minPrice must not exceed maxPrice');
    }
    return this.propertiesService.list(query);
  }

  @Get('mine')
  @UseGuards(ClerkAuthGuard)
  listMine(
    @Req() request: AuthenticatedRequest,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.propertiesService.listMine(request.auth.userId, page, limit);
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(request.auth.userId, dto);
  }

  @Patch('mine/:id')
  @UseGuards(ClerkAuthGuard)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.updateMine(request.auth.userId, id, dto);
  }

  @Post('mine/:id/hide')
  @UseGuards(ClerkAuthGuard)
  hide(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.propertiesService.hideMine(request.auth.userId, id);
  }

  @Delete('mine/:id')
  @UseGuards(ClerkAuthGuard)
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.propertiesService.deleteMine(request.auth.userId, id);
  }

  @Get(':slugOrId')
  async findOne(@Param('slugOrId') slugOrId: string) {
    const property = await this.propertiesService.findPublicBySlugOrId(slugOrId);
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }
}
