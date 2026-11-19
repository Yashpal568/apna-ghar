import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Query, Req, Res, HttpException, HttpStatus, UseGuards, UseInterceptors, UploadedFile, UnauthorizedException } from '@nestjs/common';
import type { Response, Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { createHash, createHmac } from 'node:crypto';
import { basename } from 'node:path';
import { Model, Types } from 'mongoose';
import { PropertyAuthGuard } from '../properties/property-auth.guard';
import { RateLimit } from '../common/decorators/rate-limit.decorator';
import { AllowSignedQuery } from '../common/decorators/allow-signed-query.decorator';
import { Property } from '../properties/schemas/property.schema';
import { Conversation } from './schemas/conversation.schema';
import { MessageRateLimit } from './schemas/message-rate-limit.schema';
import { Message } from './schemas/message.schema';
import { PropertyOffer } from './schemas/property-offer.schema';
import { UploadedAttachment } from './schemas/uploaded-attachment.schema';

function hasValidAttachmentSignature(buffer: Buffer, mimetype: string): boolean {
  if (!buffer || buffer.length < 4) return false;
  switch (mimetype) {
    case 'image/jpeg':
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/png':
      return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/webp':
      return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    case 'application/pdf':
      return buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x25, 0x50, 0x44, 0x46])); // %PDF
    default:
      return false;
  }
}

function sanitizeAttachmentFilename(raw?: string, mimetype?: string): string {
  const fallback = mimetype === 'application/pdf' ? 'document.pdf' : 'attachment.jpg';
  if (!raw || typeof raw !== 'string') return fallback;
  const base = basename(raw.trim());
  const clean = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  return clean || fallback;
}

type RequestWithAuth = { auth: { userId: string } };

export class MessageAttachmentDto {
  @IsOptional() @IsString() url?: string;
  @IsString() filename!: string;
  @IsString() contentType!: string;
  @IsOptional() @IsNumber() sizeBytes?: number;
  @IsOptional() @IsString() publicId?: string;
  @IsOptional() @IsString() attachmentId?: string;
}

class SendMessageDto {
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(4000) text?: string;
  @IsOptional() @ValidateNested() @Type(() => MessageAttachmentDto) attachment?: MessageAttachmentDto;
}
class StartConversationDto {
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(4000) message?: string;
}
class CreateOfferDto {
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) @Max(1000000000000) amount!: number;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(1000) message?: string;
}
class RespondOfferDto {
  @IsIn(['accept', 'reject']) action!: 'accept' | 'reject';
}

@Controller('conversations')
@UseGuards(PropertyAuthGuard)
export class ConversationsController {
  constructor(
    @InjectModel(Conversation.name) private readonly conversations: Model<Conversation>,
    @InjectModel(Property.name) private readonly properties: Model<Property>,
    @InjectModel(MessageRateLimit.name) private readonly messageRateLimits: Model<MessageRateLimit>,
    @InjectModel(Message.name) private readonly messages: Model<Message>,
    @InjectModel(PropertyOffer.name) private readonly offers: Model<PropertyOffer>,
    @InjectModel(UploadedAttachment.name) private readonly uploadedAttachments: Model<UploadedAttachment>,
  ) {}

  @Get()
  async listMine(@Req() request: RequestWithAuth) {
    const rows = await this.conversations.find({ participantIds: request.auth.userId })
      .sort({ lastMessageAt: -1 }).limit(100).select({ messages: { $slice: -1 } }).lean().exec();
    return rows.map((row) => ({
      ...row,
      unreadCountByUser: row.unreadCountByUser instanceof Map
        ? Object.fromEntries(row.unreadCountByUser)
        : row.unreadCountByUser || {},
    }));
  }

  @Post('property/:propertyId')
  @RateLimit({ limit: 30, ttlSeconds: 60 })
  async startForProperty(@Req() request: RequestWithAuth, @Param('propertyId') propertyId: string, @Body() body: StartConversationDto) {
    const property = await this.properties.findOne({
      $or: [{ _id: this.isObjectId(propertyId) ? propertyId : null }, { slug: propertyId }],
      status: 'active',
      deletedAt: null,
    }).lean().exec();
    if (!property) throw new NotFoundException('This property is no longer available.');
    if (property.ownerId === request.auth.userId) throw new BadRequestException('You cannot start a buyer conversation with your own listing.');

    let conversation = await this.conversations.findOne({ propertyId: String(property._id), buyerId: request.auth.userId }).exec();
    if (!conversation) {
      try {
        conversation = await this.conversations.create({
          propertyId: String(property._id),
          propertyTitle: property.title,
          propertySlug: property.slug,
          ownerId: property.ownerId,
          buyerId: request.auth.userId,
          participantIds: [property.ownerId, request.auth.userId],
          messages: [],
          unreadCountByUser: new Map([[property.ownerId, 0], [request.auth.userId, 0]]),
          lastMessageAt: new Date(),
        });
      } catch (error) {
        // Two first-contact requests can race against the unique property/buyer index.
        if ((error as { code?: number })?.code !== 11000) throw error;
        conversation = await this.conversations.findOne({ propertyId: String(property._id), buyerId: request.auth.userId }).exec();
        if (!conversation) throw error;
      }
    }
    if (body?.message?.trim()) {
      await this.consumeMessageQuota(request.auth.userId);
      const sentAt = new Date();
      const message = { _id: new Types.ObjectId(), senderId: request.auth.userId, text: body.message.trim(), sentAt };
      const result = await this.conversations.updateOne(
        { _id: conversation._id, participantIds: request.auth.userId },
        {
          $push: { messages: message },
          $set: { lastMessageAt: sentAt },
          $inc: { [`unreadCountByUser.${property.ownerId}`]: 1 },
        },
      ).exec();
      await this.messages.updateOne(
        { _id: message._id },
        { $setOnInsert: { conversationId: new Types.ObjectId(String(conversation._id)), senderId: message.senderId, text: message.text, sentAt } },
        { upsert: true },
      ).exec();
      if (result.matchedCount !== 1) throw new NotFoundException('Conversation not found.');
    }
    return { conversationId: String(conversation._id), propertyId: conversation.propertyId, propertyTitle: conversation.propertyTitle };
  }

  private getAttachmentSecret(): string {
    return process.env.ATTACHMENT_SECRET || process.env.CLERK_SECRET_KEY || process.env.CLOUDINARY_API_SECRET || 'apna-ghar-attachment-fallback-secret-key-384912';
  }

  private generateSignedAttachmentUrl(conversationId: string, messageId: string, expiresInSeconds = 3600): { url: string; expiresAt: string } {
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const secret = this.getAttachmentSecret();
    const signature = createHmac('sha256', secret)
      .update(`${conversationId}:${messageId}:${expires}`)
      .digest('hex');
    const url = `/api/v1/conversations/${conversationId}/messages/${messageId}/attachment?expires=${expires}&sig=${signature}`;
    return { url, expiresAt: new Date(expires * 1000).toISOString() };
  }

  private signMessageAttachments(messages: any[], conversationId: string) {
    return messages.map((m) => {
      const raw = typeof m?.toObject === 'function' ? m.toObject() : { ...m };
      if (raw.attachment) {
        const messageId = String(raw._id);
        const signed = this.generateSignedAttachmentUrl(conversationId, messageId);
        raw.attachment = {
          attachmentId: raw.attachment.attachmentId || messageId,
          filename: raw.attachment.filename,
          contentType: raw.attachment.contentType,
          sizeBytes: raw.attachment.sizeBytes,
          url: signed.url,
          expiresAt: signed.expiresAt,
        };
      }
      return raw;
    });
  }

  @Get(':conversationId')
  async getOne(@Req() request: RequestWithAuth, @Param('conversationId') conversationId: string) {
    if (!this.isObjectId(conversationId)) throw new NotFoundException('Conversation not found.');
    const conversation = await this.conversations.findOne({
      _id: new Types.ObjectId(conversationId),
      participantIds: request.auth.userId,
    }).lean().exec();
    if (!conversation) throw new NotFoundException('Conversation not found.');
    return {
      ...conversation,
      messages: this.signMessageAttachments(conversation.messages || [], conversationId),
      unreadCountByUser: conversation.unreadCountByUser instanceof Map
        ? Object.fromEntries(conversation.unreadCountByUser)
        : conversation.unreadCountByUser || {},
    };
  }

  @Get(':conversationId/messages')
  async getMessages(
    @Req() request: RequestWithAuth,
    @Param('conversationId') conversationId: string,
    @Query('before') before?: string,
    @Query('limit') rawLimit?: string,
  ) {
    if (!this.isObjectId(conversationId)) throw new NotFoundException('Conversation not found.');
    const limit = rawLimit === undefined ? 50 : Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('Message page size must be between 1 and 100.');
    }
    const beforeDate = before === undefined ? null : new Date(before);
    if (before !== undefined && (!Number.isFinite(beforeDate?.getTime()))) {
      throw new BadRequestException('Message cursor must be a valid ISO date.');
    }
    const conversation = await this.conversations.findOne({
      _id: new Types.ObjectId(conversationId),
      participantIds: request.auth.userId,
    }).select({ propertyId: 1, propertyTitle: 1, participantIds: 1 }).lean().exec();
    if (!conversation) throw new NotFoundException('Conversation not found.');
    this.assertParticipant(conversation.participantIds, request.auth.userId);

    // Read both stores during migration and merge by message id. This keeps older
    // embedded history visible even while the backfill is being run in production.
    const messageFilter: Record<string, unknown> = { conversationId: new Types.ObjectId(conversationId) };
    if (beforeDate) messageFilter.sentAt = { $lt: beforeDate };
    const dedicatedMessages = await this.messages.find(messageFilter)
      .sort({ sentAt: -1, _id: -1 }).limit(limit + 1).lean().exec();

    const legacyRows = await this.conversations.aggregate([
      { $match: { _id: new Types.ObjectId(conversationId), participantIds: request.auth.userId } },
      { $project: { messages: 1 } },
      {
        $project: {
          messages: {
            $slice: [
              {
                $filter: {
                  input: '$messages',
                  as: 'message',
                  cond: beforeDate ? { $lt: ['$$message.sentAt', beforeDate] } : true,
                },
              },
              -(limit + 1),
            ],
          },
        },
      },
    ]).exec();
    const legacyMessages = legacyRows[0]?.messages || [];
    const seenMessageIds = new Set<string>();
    const combinedMessages = [...dedicatedMessages, ...legacyMessages]
      .filter((message) => {
        const id = message._id ? String(message._id) : `${message.senderId}:${new Date(message.sentAt).toISOString()}:${message.text}`;
        if (seenMessageIds.has(id)) return false;
        seenMessageIds.add(id);
        return true;
      })
      .sort((left, right) => new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime());

    const hasMore = combinedMessages.length > limit;
    const page = hasMore ? combinedMessages.slice(-limit) : combinedMessages;
    const formattedMessages = this.signMessageAttachments(page, conversationId);
    return {
      conversationId,
      propertyId: conversation.propertyId,
      propertyTitle: conversation.propertyTitle,
      messages: formattedMessages,
      hasMore,
      nextBefore: hasMore && page.length ? page[0].sentAt : null,
    };
  }

  @Patch(':conversationId/read')
  async markRead(@Req() request: RequestWithAuth, @Param('conversationId') conversationId: string) {
    if (!this.isObjectId(conversationId)) throw new NotFoundException('Conversation not found.');
    const result = await this.conversations.updateOne(
      { _id: new Types.ObjectId(conversationId), participantIds: request.auth.userId },
      { $set: { [`unreadCountByUser.${request.auth.userId}`]: 0 } },
    ).exec();
    if (result.matchedCount !== 1) throw new NotFoundException('Conversation not found.');
    return { success: true, unreadCount: 0 };
  }

  @Post('upload')
  @RateLimit({ limit: 30, ttlSeconds: 60 })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadAttachment(
    @Req() request: RequestWithAuth,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; size: number; originalname?: string },
  ) {
    if (!request.auth?.userId) throw new BadRequestException('Authenticated identity is missing');
    if (!file) throw new BadRequestException('Choose a file to attach');
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG, WebP images and PDF documents are allowed (up to 10MB)');
    }
    if (!hasValidAttachmentSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException('File content does not match allowed MIME type signature');
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const filename = sanitizeAttachmentFilename(file.originalname, file.mimetype);
    const attachmentId = new Types.ObjectId();
    let publicId: string | undefined = undefined;
    let storageUrl: string | undefined = undefined;

    if (cloudName && apiKey && apiSecret) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = 'apna-ghar/messages/private';
        const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'raw';
        const signature = createHash('sha1')
          .update(`access_mode=authenticated&folder=${folder}&timestamp=${timestamp}${apiSecret}`)
          .digest('hex');

        const form = new FormData();
        form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), filename);
        form.append('api_key', apiKey);
        form.append('timestamp', String(timestamp));
        form.append('folder', folder);
        form.append('access_mode', 'authenticated');
        form.append('signature', signature);

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`,
          { method: 'POST', body: form },
        );
        const result = (await cloudinaryResponse.json().catch(() => null)) as {
          secure_url?: string;
          public_id?: string;
          error?: { message?: string };
        } | null;

        if (cloudinaryResponse.ok && result?.secure_url) {
          publicId = result.public_id;
          storageUrl = result.secure_url;
        }
      } catch {
        // Fall back to database buffer storage
      }
    }

    const base64Data = file.buffer.toString('base64');
    await this.uploadedAttachments.create({
      _id: attachmentId,
      uploaderId: request.auth.userId,
      filename,
      contentType: file.mimetype,
      sizeBytes: file.size,
      publicId,
      storageUrl,
      dataBuffer: base64Data,
      claimed: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      attachmentId: attachmentId.toString(),
      filename,
      contentType: file.mimetype,
      sizeBytes: file.size,
      url: `/api/v1/conversations/attachments/${attachmentId.toString()}`,
    };
  }

  @Get('attachments/:attachmentId')
  @RateLimit({ limit: 60, ttlSeconds: 60 })
  async getUploadedAttachmentPreview(
    @Req() request: RequestWithAuth,
    @Res() response: Response,
    @Param('attachmentId') attachmentId: string,
  ) {
    if (!this.isObjectId(attachmentId)) throw new NotFoundException('Attachment not found.');
    const record = await this.uploadedAttachments.findOne({
      _id: new Types.ObjectId(attachmentId),
      uploaderId: request.auth.userId,
    }).lean().exec();
    if (!record) throw new NotFoundException('Attachment not found or access denied.');

    const contentType = record.contentType || 'application/octet-stream';
    const filename = sanitizeAttachmentFilename(record.filename, contentType);

    response.setHeader('Content-Type', contentType);
    response.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    response.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Expires', '0');
    response.setHeader('X-Content-Type-Options', 'nosniff');

    if (record.dataBuffer) {
      const buffer = Buffer.from(record.dataBuffer, 'base64');
      return response.end(buffer);
    }
    throw new NotFoundException('Attachment content unavailable.');
  }

  @Get(':conversationId/messages/:messageId/attachment')
  @AllowSignedQuery()
  @RateLimit({ limit: 60, ttlSeconds: 60 })
  async getMessageAttachment(
    @Req() request: any,
    @Res() response: Response,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Query('expires') expiresQuery?: string,
    @Query('sig') sigQuery?: string,
  ) {
    if (!this.isObjectId(conversationId) || !this.isObjectId(messageId)) {
      throw new NotFoundException('Conversation or message not found.');
    }

    const authUserId = request.authUserId || request.auth?.userId;
    const hasSignedQuery = !!(expiresQuery && sigQuery);
    let isAuthorized = false;

    if (hasSignedQuery) {
      const exp = Number(expiresQuery);
      if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
        throw new ForbiddenException('Attachment access URL has expired.');
      }
      const secret = this.getAttachmentSecret();
      const expectedSig = createHmac('sha256', secret)
        .update(`${conversationId}:${messageId}:${exp}`)
        .digest('hex');
      if (sigQuery !== expectedSig) {
        throw new ForbiddenException('Invalid or malformed attachment signature.');
      }
      const conversation = await this.conversations.findById(conversationId).select({ _id: 1 }).lean().exec();
      if (!conversation) throw new NotFoundException('Conversation not found.');
      isAuthorized = true;
    } else if (authUserId) {
      const conversation = await this.conversations.findOne({
        _id: new Types.ObjectId(conversationId),
        participantIds: authUserId,
      }).select({ _id: 1, participantIds: 1 }).lean().exec();
      if (!conversation) throw new NotFoundException('Conversation not found or participant access denied.');
      isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new UnauthorizedException('Authentication or valid signed URL signature required.');
    }

    // Retrieve message and attachment
    let message = await this.messages.findOne({
      _id: new Types.ObjectId(messageId),
      conversationId: new Types.ObjectId(conversationId),
    }).lean().exec();

    let attachment = message?.attachment;
    if (!attachment) {
      // Check legacy embedded messages in conversation document
      const conv = await this.conversations.findOne(
        { _id: new Types.ObjectId(conversationId), 'messages._id': new Types.ObjectId(messageId) },
        { 'messages.$': 1 },
      ).lean().exec();
      attachment = conv?.messages?.[0]?.attachment;
    }

    if (!attachment) {
      throw new NotFoundException('Attachment not found for this message.');
    }

    const contentType = attachment.contentType || 'application/octet-stream';
    const filename = sanitizeAttachmentFilename(attachment.filename, contentType);

    response.setHeader('Content-Type', contentType);
    response.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    response.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Expires', '0');
    response.setHeader('X-Content-Type-Options', 'nosniff');

    const attachmentRecord = attachment as any;

    if (attachmentRecord.dataBuffer) {
      const buffer = Buffer.from(attachmentRecord.dataBuffer, 'base64');
      return response.end(buffer);
    }

    if (attachmentRecord.storageUrl && attachmentRecord.storageUrl.startsWith('data:')) {
      const base64Index = attachmentRecord.storageUrl.indexOf('base64,');
      if (base64Index !== -1) {
        const buffer = Buffer.from(attachmentRecord.storageUrl.slice(base64Index + 7), 'base64');
        return response.end(buffer);
      }
    }

    if (attachmentRecord.url && attachmentRecord.url.startsWith('data:')) {
      const base64Index = attachmentRecord.url.indexOf('base64,');
      if (base64Index !== -1) {
        const buffer = Buffer.from(attachmentRecord.url.slice(base64Index + 7), 'base64');
        return response.end(buffer);
      }
    }

    if (attachmentRecord.publicId) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      if (cloudName && apiKey && apiSecret) {
        try {
          const timestamp = Math.floor(Date.now() / 1000);
          const resourceType = contentType.startsWith('image/') ? 'image' : 'raw';
          const toSign = `public_id=${attachmentRecord.publicId}&timestamp=${timestamp}${apiSecret}`;
          const signature = createHash('sha1').update(toSign).digest('hex');
          const downloadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/download?public_id=${encodeURIComponent(attachmentRecord.publicId)}&timestamp=${timestamp}&signature=${signature}&api_key=${encodeURIComponent(apiKey)}`;
          const cRes = await fetch(downloadUrl);
          if (cRes.ok) {
            const arrayBuf = await cRes.arrayBuffer();
            return response.end(Buffer.from(arrayBuf));
          }
        } catch {
          // Cloudinary download failed
        }
      }
    }

    if (attachmentRecord.storageUrl && attachmentRecord.storageUrl.startsWith('http')) {
      try {
        const extRes = await fetch(attachmentRecord.storageUrl);
        if (extRes.ok) {
          const arrayBuf = await extRes.arrayBuffer();
          return response.end(Buffer.from(arrayBuf));
        }
      } catch {
        // External fetch failed
      }
    }

    throw new NotFoundException('Attachment content could not be retrieved.');
  }

  @Get(':conversationId/messages/:messageId/attachment-url')
  @RateLimit({ limit: 60, ttlSeconds: 60 })
  async getAttachmentSignedUrl(
    @Req() request: RequestWithAuth,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    if (!this.isObjectId(conversationId) || !this.isObjectId(messageId)) {
      throw new NotFoundException('Conversation or message not found.');
    }
    const conversation = await this.conversations.findOne({
      _id: new Types.ObjectId(conversationId),
      participantIds: request.auth.userId,
    }).select({ _id: 1, participantIds: 1 }).lean().exec();
    if (!conversation) throw new NotFoundException('Conversation not found or participant access denied.');

    const message = await this.messages.findOne({
      _id: new Types.ObjectId(messageId),
      conversationId: new Types.ObjectId(conversationId),
    }).lean().exec();
    if (!message || !message.attachment) {
      throw new NotFoundException('Attachment not found for this message.');
    }

    const signed = this.generateSignedAttachmentUrl(conversationId, messageId);
    return {
      url: signed.url,
      expiresAt: signed.expiresAt,
    };
  }

  @Post(':conversationId/messages')
  @RateLimit({ limit: 30, ttlSeconds: 60 })
  async sendMessage(@Req() request: RequestWithAuth, @Param('conversationId') conversationId: string, @Body() body: SendMessageDto) {
    if (!this.isObjectId(conversationId)) throw new NotFoundException('Conversation not found.');
    const text = body.text?.trim() || '';
    const attachment = body.attachment;
    if (!text && !attachment) throw new BadRequestException('Write a message first.');
    const conversation = await this.conversations.findOne({
      _id: new Types.ObjectId(conversationId),
      participantIds: request.auth.userId,
    }).exec();
    if (!conversation) throw new NotFoundException('Conversation not found.');
    await this.consumeMessageQuota(request.auth.userId);

    let verifiedAttachment: any = undefined;
    if (attachment) {
      if (attachment.attachmentId && this.isObjectId(attachment.attachmentId)) {
        const record = await this.uploadedAttachments.findOne({
          _id: new Types.ObjectId(attachment.attachmentId),
          uploaderId: request.auth.userId,
        }).exec();
        if (!record) {
          throw new BadRequestException('Attachment was not found or does not belong to your account.');
        }
        await this.uploadedAttachments.updateOne(
          { _id: record._id },
          { $set: { claimed: true, conversationId: conversation._id } },
        ).exec();
        verifiedAttachment = {
          attachmentId: record._id.toString(),
          filename: record.filename,
          contentType: record.contentType,
          sizeBytes: record.sizeBytes,
          publicId: record.publicId,
          storageUrl: record.storageUrl,
          dataBuffer: record.dataBuffer,
        };
      } else if (attachment.url && (attachment.url.startsWith('data:') || attachment.url.includes('/attachments/'))) {
        const match = attachment.url.match(/attachments\/([a-f0-9]{24})/i);
        if (match && match[1]) {
          const record = await this.uploadedAttachments.findOne({
            _id: new Types.ObjectId(match[1]),
            uploaderId: request.auth.userId,
          }).exec();
          if (!record) {
            throw new BadRequestException('Attachment was not found or does not belong to your account.');
          }
          await this.uploadedAttachments.updateOne(
            { _id: record._id },
            { $set: { claimed: true, conversationId: conversation._id } },
          ).exec();
          verifiedAttachment = {
            attachmentId: record._id.toString(),
            filename: record.filename,
            contentType: record.contentType,
            sizeBytes: record.sizeBytes,
            publicId: record.publicId,
            storageUrl: record.storageUrl,
            dataBuffer: record.dataBuffer,
          };
        } else if (attachment.url.startsWith('data:')) {
          verifiedAttachment = {
            filename: sanitizeAttachmentFilename(attachment.filename, attachment.contentType),
            contentType: attachment.contentType,
            sizeBytes: attachment.sizeBytes || 0,
            storageUrl: attachment.url,
          };
        } else {
          throw new BadRequestException('Invalid or unverified attachment.');
        }
      } else {
        throw new BadRequestException('Attachment must be uploaded through the secure upload endpoint.');
      }
    }

    const recipientId = conversation.ownerId === request.auth.userId ? conversation.buyerId : conversation.ownerId;
    const sentAt = new Date();
    const message = {
      _id: new Types.ObjectId(),
      senderId: request.auth.userId,
      text,
      attachment: verifiedAttachment,
      sentAt,
    };
    const result = await this.conversations.updateOne(
      { _id: new Types.ObjectId(conversationId), participantIds: request.auth.userId },
      {
        $push: { messages: message },
        $set: { lastMessageAt: sentAt },
        $inc: { [`unreadCountByUser.${recipientId}`]: 1 },
      },
    ).exec();
    await this.messages.updateOne(
      { _id: message._id },
      {
        $setOnInsert: {
          conversationId: new Types.ObjectId(conversationId),
          senderId: message.senderId,
          text: message.text,
          attachment: message.attachment,
          sentAt,
        },
      },
      { upsert: true },
    ).exec();
    if (result.matchedCount !== 1) throw new NotFoundException('Conversation not found.');
    const formattedMessage = this.signMessageAttachments([message], conversationId)[0];
    return { success: true, message: formattedMessage };
  }


  @Get(':conversationId/offers')
  async listOffers(@Req() request: RequestWithAuth, @Param('conversationId') conversationId: string) {
    if (!this.isObjectId(conversationId)) throw new NotFoundException('Conversation not found.');
    const conversation = await this.conversations.findOne({
      _id: new Types.ObjectId(conversationId),
      participantIds: request.auth.userId,
    }).select({ participantIds: 1 }).lean().exec();
    if (!conversation) throw new NotFoundException('Conversation not found.');
    this.assertParticipant(conversation.participantIds, request.auth.userId);
    return this.offers.find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1, _id: 1 }).lean().exec();
  }

  @Post(':conversationId/offers')
  @RateLimit({ limit: 30, ttlSeconds: 60 })
  async createOffer(@Req() request: RequestWithAuth, @Param('conversationId') conversationId: string, @Body() body: CreateOfferDto) {
    if (!this.isObjectId(conversationId)) throw new NotFoundException('Conversation not found.');
    const conversation = await this.conversations.findOne({
      _id: new Types.ObjectId(conversationId),
      participantIds: request.auth.userId,
    }).exec();
    if (!conversation) throw new NotFoundException('Conversation not found.');
    if (conversation.buyerId !== request.auth.userId) {
      throw new ForbiddenException('Only the buyer can submit the initial property proposal. Use counter-offer to respond as the owner.');
    }
    const property = await this.properties.findById(conversation.propertyId).lean().exec();
    if (!property || property.status !== 'active' || property.deletedAt) {
      throw new BadRequestException('This property is no longer accepting proposals.');
    }
    const askingPrice = Number(property.priceAmount);
    if (!Number.isFinite(askingPrice) || askingPrice <= 0) {
      throw new BadRequestException('The property asking price is unavailable.');
    }
    await this.consumeMessageQuota(request.auth.userId);
    const offer = await this.offers.create({
      conversationId: new Types.ObjectId(conversationId),
      propertyId: conversation.propertyId,
      buyerId: conversation.buyerId,
      ownerId: conversation.ownerId,
      senderId: request.auth.userId,
      recipientId: conversation.ownerId,
      amount: body.amount,
      askingPriceAtOffer: askingPrice,
      message: body.message?.trim() || undefined,
      previousOfferId: null,
      status: 'pending',
    });
    await this.conversations.updateOne(
      { _id: new Types.ObjectId(conversationId), participantIds: request.auth.userId },
      { $set: { lastMessageAt: new Date() }, $inc: { [`unreadCountByUser.${conversation.ownerId}`]: 1 } },
    ).exec();
    return { success: true, offer };
  }

  @Post(':conversationId/offers/:offerId/counter')
  @RateLimit({ limit: 30, ttlSeconds: 60 })
  async counterOffer(
    @Req() request: RequestWithAuth,
    @Param('conversationId') conversationId: string,
    @Param('offerId') offerId: string,
    @Body() body: CreateOfferDto,
  ) {
    if (!this.isObjectId(conversationId) || !this.isObjectId(offerId)) throw new NotFoundException('Offer not found.');
    const conversation = await this.conversations.findOne({
      _id: new Types.ObjectId(conversationId),
      participantIds: request.auth.userId,
    }).exec();
    if (!conversation) throw new NotFoundException('Conversation not found.');
    const previous = await this.offers.findOne({
      _id: new Types.ObjectId(offerId),
      conversationId: new Types.ObjectId(conversationId),
      recipientId: request.auth.userId,
      status: 'pending',
    }).exec();
    if (!previous) throw new NotFoundException('Offer not found.');
    await this.consumeMessageQuota(request.auth.userId);
    const counter = await this.offers.create({
      conversationId: new Types.ObjectId(conversationId),
      propertyId: conversation.propertyId,
      buyerId: conversation.buyerId,
      ownerId: conversation.ownerId,
      senderId: request.auth.userId,
      recipientId: previous.senderId,
      amount: body.amount,
      askingPriceAtOffer: previous.askingPriceAtOffer,
      message: body.message?.trim() || undefined,
      previousOfferId: previous._id,
      status: 'pending',
    });
    const claimed = await this.offers.updateOne(
      { _id: previous._id, recipientId: request.auth.userId, status: 'pending' },
      { $set: { status: 'countered', respondedAt: new Date() } },
    ).exec();
    if (claimed.matchedCount !== 1) {
      await this.offers.deleteOne({ _id: counter._id }).exec();
      throw new BadRequestException('This offer has already been answered.');
    }
    await this.conversations.updateOne(
      { _id: new Types.ObjectId(conversationId), participantIds: request.auth.userId },
      { $set: { lastMessageAt: new Date() }, $inc: { [`unreadCountByUser.${previous.senderId}`]: 1 } },
    ).exec();
    return { success: true, offer: counter };
  }

  @Patch(':conversationId/offers/:offerId/respond')
  @RateLimit({ limit: 30, ttlSeconds: 60 })
  async respondToOffer(
    @Req() request: RequestWithAuth,
    @Param('conversationId') conversationId: string,
    @Param('offerId') offerId: string,
    @Body() body: RespondOfferDto,
  ) {
    if (!this.isObjectId(conversationId) || !this.isObjectId(offerId)) throw new NotFoundException('Offer not found.');
    const conversation = await this.conversations.findOne({
      _id: new Types.ObjectId(conversationId),
      participantIds: request.auth.userId,
    }).select({ participantIds: 1 }).lean().exec();
    if (!conversation) throw new NotFoundException('Conversation not found.');
    this.assertParticipant(conversation.participantIds, request.auth.userId);
    const offer = await this.offers.findOneAndUpdate(
      {
        _id: new Types.ObjectId(offerId),
        conversationId: new Types.ObjectId(conversationId),
        recipientId: request.auth.userId,
        status: 'pending',
      },
      { $set: { status: body.action === 'accept' ? 'accepted' : 'rejected', respondedAt: new Date() } },
      { new: true },
    ).lean().exec();
    if (!offer) throw new BadRequestException('This offer is no longer pending or you cannot respond to it.');
    await this.conversations.updateOne(
      { _id: new Types.ObjectId(conversationId), participantIds: request.auth.userId },
      { $set: { lastMessageAt: new Date() }, $inc: { [`unreadCountByUser.${offer.senderId}`]: 1 } },
    ).exec();
    return { success: true, offer };
  }

  private async consumeMessageQuota(userId: string) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60_000);
    const expiresAt = new Date(now.getTime() + 120_000);
    const increment = () => this.messageRateLimits.findOneAndUpdate(
      { _id: userId, windowStartedAt: { $gte: windowStart }, count: { $lt: 20 } },
      { $inc: { count: 1 }, $set: { expiresAt } },
      { new: true },
    ).exec();

    if (await increment()) return;

    try {
      const reset = await this.messageRateLimits.findOneAndUpdate(
        { _id: userId, $or: [{ windowStartedAt: { $lt: windowStart } }, { windowStartedAt: { $exists: false } }] },
        { $set: { windowStartedAt: now, count: 1, expiresAt } },
        { new: true, upsert: true },
      ).exec();
      if (reset) return;
    } catch (error) {
      if ((error as { code?: number })?.code !== 11000) throw error;
    }

    if (await increment()) return;
    throw new HttpException('You are sending messages too quickly. Try again in a minute.', HttpStatus.TOO_MANY_REQUESTS);
  }

  private assertParticipant(participants: string[], userId: string) {
    if (!participants.includes(userId)) throw new ForbiddenException('You do not have access to this conversation.');
  }

  private isObjectId(value: string) {
    return /^[a-f\d]{24}$/i.test(value);
  }
}
