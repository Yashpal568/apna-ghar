import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Patch, Query, Req, UseGuards, UseInterceptors, UploadedFile, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createHash } from 'node:crypto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyAuthGuard } from './property-auth.guard';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { PropertiesService } from './properties.service';

type AuthenticatedRequest = { authUserId?: string };
type UploadedImage = { buffer: Buffer; mimetype: string; size: number };

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post('images')
  @UseGuards(PropertyAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  async uploadImage(@Req() request: AuthenticatedRequest, @UploadedFile() file?: UploadedImage) {
    if (!request.authUserId) throw new BadRequestException('Authenticated owner identity is missing');
    if (!file) throw new BadRequestException('Choose an image to upload');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP or AVIF images are allowed');
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException('Image uploads are not configured on the server');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'apna-ghar/properties';
    const signature = createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), 'property-image');
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);

    const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
      method: 'POST',
      body: form,
    });
    const result = await cloudinaryResponse.json().catch(() => null) as { secure_url?: string; public_id?: string; error?: { message?: string } } | null;
    if (!cloudinaryResponse.ok || !result?.secure_url) {
      throw new BadRequestException(result?.error?.message || 'Cloudinary could not upload this image');
    }

    return { url: result.secure_url, publicId: result.public_id };
  }

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

  @Patch(':id')
  @UseGuards(PropertyAuthGuard)
  async updateMine(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: UpdatePropertyDto) {
    if (!request.authUserId) throw new BadRequestException('Authenticated owner identity is missing');
    const property = await this.propertiesService.updateMine(request.authUserId, id, body);
    if (!property) throw new NotFoundException('Property not found or not owned by this account');
    return property;
  }

  @Patch(':id/visibility')
  @UseGuards(PropertyAuthGuard)
  async setVisibilityMine(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: { visible?: boolean }) {
    if (!request.authUserId) throw new BadRequestException('Authenticated owner identity is missing');
    if (typeof body.visible !== 'boolean') throw new BadRequestException('visible must be a boolean');
    const property = await this.propertiesService.setVisibilityMine(request.authUserId, id, body.visible);
    if (!property) throw new NotFoundException('Property not found or not owned by this account');
    return property;
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
