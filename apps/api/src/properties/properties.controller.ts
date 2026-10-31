import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Patch, Query, Req, UseGuards, UseInterceptors, UploadedFile, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createHash } from 'node:crypto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyAuthGuard } from './property-auth.guard';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { PropertiesService } from './properties.service';
import { IsBoolean } from 'class-validator';

class SetPropertyVisibilityDto {
  @IsBoolean() visible!: boolean;
}

type AuthenticatedRequest = { authUserId?: string };
type UploadedImage = { buffer: Buffer; mimetype: string; size: number };

function hasValidMediaSignature(file: UploadedImage, kind: 'image' | 'video'): boolean {
  const bytes = file.buffer;
  if (kind === 'image') {
    switch (file.mimetype) {
      case 'image/jpeg': return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      case 'image/png': return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      case 'image/webp': return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
      case 'image/avif': return bytes.length >= 12 && bytes.toString('ascii', 4, 8) === 'ftyp' && /^(avif|avis)$/.test(bytes.toString('ascii', 8, 12));
      default: return false;
    }
  }
  if (file.mimetype === 'video/webm') return bytes.length >= 4 && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (file.mimetype === 'video/mp4' || file.mimetype === 'video/quicktime') return bytes.length >= 12 && bytes.toString('ascii', 4, 8) === 'ftyp';
  return false;
}

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post('images')
  @UseGuards(PropertyAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  async uploadImage(@Req() request: AuthenticatedRequest, @UploadedFile() file?: UploadedImage) {
    if (!request.authUserId) throw new BadRequestException('Authenticated owner identity is missing');
    if (!file) throw new BadRequestException('Choose an image to upload');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype) || !hasValidMediaSignature(file, 'image')) {
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
    // Resize and compress the stored source on ingest to reduce Cloudinary storage.
    // Delivery URLs remain normal image URLs; Cloudinary negotiates modern formats per browser.
    const transformation = 'c_limit,w_2000,h_2000,q_auto:good';
    const signature = createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}&transformation=${transformation}${apiSecret}`)
      .digest('hex');

    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), 'property-image');
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('transformation', transformation);
    form.append('signature', signature);

    const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
      method: 'POST',
      body: form,
    });
    const result = await cloudinaryResponse.json().catch(() => null) as { secure_url?: string; public_id?: string; error?: { message?: string } } | null;
    if (!cloudinaryResponse.ok || !result?.secure_url) {
      const cloudinaryMessage = result?.error?.message || 'Cloudinary could not upload this image';
      if (/missing permissions|not authorized|forbidden/i.test(cloudinaryMessage)) {
        throw new BadRequestException('Cloudinary rejected the API key: enable Upload/Create permissions for this key in Cloudinary Console → Settings → Access Keys, then redeploy/retry.');
      }
      throw new BadRequestException(cloudinaryMessage);
    }

    return { url: result.secure_url, publicId: result.public_id };
  }

  @Post('videos')
  @UseGuards(PropertyAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 100 * 1024 * 1024 } }))
  async uploadVideo(@Req() request: AuthenticatedRequest, @UploadedFile() file?: UploadedImage) {
    if (!request.authUserId) throw new BadRequestException('Authenticated owner identity is missing');
    if (!file) throw new BadRequestException('Choose a video to upload');
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.mimetype) || !hasValidMediaSignature(file, 'video')) throw new BadRequestException('Only valid MP4, WebM or MOV videos are allowed');
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME, apiKey = process.env.CLOUDINARY_API_KEY, apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) throw new InternalServerErrorException('Video uploads are not configured on the server');
    const timestamp = Math.floor(Date.now() / 1000), folder = 'apna-ghar/properties';
    const signature = createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest('hex');
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), 'property-video');
    form.append('api_key', apiKey); form.append('timestamp', String(timestamp)); form.append('folder', folder); form.append('signature', signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/video/upload`, { method: 'POST', body: form });
    const result = await response.json().catch(() => null) as { secure_url?: string; error?: { message?: string } } | null;
    if (!response.ok || !result?.secure_url) throw new BadRequestException(result?.error?.message || 'Cloudinary could not upload this video');
    return { url: result.secure_url, resourceType: 'video' };
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
  async setVisibilityMine(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: SetPropertyVisibilityDto) {
    if (!request.authUserId) throw new BadRequestException('Authenticated owner identity is missing');
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
    if (!slugOrId || typeof slugOrId !== 'string' || !slugOrId.trim() || slugOrId.toLowerCase() === 'undefined' || slugOrId.toLowerCase() === 'null') {
      throw new NotFoundException('Property not found');
    }
    const property = await this.propertiesService.findPublicBySlugOrId(slugOrId);
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }
}
