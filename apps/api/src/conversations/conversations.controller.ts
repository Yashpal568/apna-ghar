import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Query, Req, TooManyRequestsException, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Model, Types } from 'mongoose';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { Property } from '../properties/schemas/property.schema';
import { Conversation } from './schemas/conversation.schema';
import { MessageRateLimit } from './schemas/message-rate-limit.schema';

type RequestWithAuth = { auth: { userId: string } };
class SendMessageDto {
  @IsString() @MinLength(1) @MaxLength(4000) text!: string;
}
class StartConversationDto {
  @IsOptional() @IsString() @MaxLength(4000) message?: string;
}

@Controller('conversations')
@UseGuards(ClerkAuthGuard)
export class ConversationsController {
  constructor(
    @InjectModel(Conversation.name) private readonly conversations: Model<Conversation>,
    @InjectModel(Property.name) private readonly properties: Model<Property>,
    @InjectModel(MessageRateLimit.name) private readonly messageRateLimits: Model<MessageRateLimit>,
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
  async startForProperty(@Req() request: RequestWithAuth, @Param('propertyId') propertyId: string, @Body() body: StartConversationDto) {
    const property = await this.properties.findOne({
      $or: [{ _id: this.isObjectId(propertyId) ? propertyId : null }, { slug: propertyId }],
      status: 'active',
    }).lean().exec();
    if (!property) throw new NotFoundException('This property is no longer available.');
    if (property.ownerId === request.auth.userId) throw new BadRequestException('You cannot start a buyer conversation with your own listing.');

    let conversation = await this.conversations.findOne({ propertyId: String(property._id), buyerId: request.auth.userId }).exec();
    if (!conversation) {
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
    }
    if (body?.message?.trim()) {
      conversation.messages.push({ senderId: request.auth.userId, text: body.message.trim(), sentAt: new Date() } as never);
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }
    return { conversationId: String(conversation._id), propertyId: conversation.propertyId, propertyTitle: conversation.propertyTitle };
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
    const rows = await this.conversations.aggregate([
      { $match: { _id: new Types.ObjectId(conversationId) } },
      { $project: { propertyId: 1, propertyTitle: 1, participantIds: 1, messages: 1 } },
      {
        $project: {
          propertyId: 1,
          propertyTitle: 1,
          participantIds: 1,
          messages: {
            $slice: [
              {
                $filter: {
                  input: '$messages',
                  as: 'message',
                  cond: beforeDate ? { $lt: ['$message.sentAt', beforeDate] } : true,
                },
              },
              -(limit + 1),
            ],
          },
        },
      },
    ]).exec();
    const conversation = rows[0];
    if (!conversation) throw new NotFoundException('Conversation not found.');
    this.assertParticipant(conversation.participantIds, request.auth.userId);
    const hasMore = conversation.messages.length > limit;
    const messages = hasMore ? conversation.messages.slice(-limit) : conversation.messages;
    return {
      conversationId,
      propertyId: conversation.propertyId,
      propertyTitle: conversation.propertyTitle,
      messages,
      hasMore,
      nextBefore: hasMore && messages.length ? messages[0].sentAt : null,
    };
  }

  @Patch(':conversationId/read')
  async markRead(@Req() request: RequestWithAuth, @Param('conversationId') conversationId: string) {
    const conversation = await this.conversations.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException('Conversation not found.');
    this.assertParticipant(conversation.participantIds, request.auth.userId);
    conversation.unreadCountByUser ??= new Map<string, number>();
    conversation.unreadCountByUser.set(request.auth.userId, 0);
    conversation.save && await conversation.save();
    return { success: true, unreadCount: 0 };
  }

  @Post(':conversationId/messages')
  async sendMessage(@Req() request: RequestWithAuth, @Param('conversationId') conversationId: string, @Body() body: SendMessageDto) {
    const text = body.text?.trim();
    if (!text) throw new BadRequestException('Write a message first.');
    const conversation = await this.conversations.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException('Conversation not found.');
    this.assertParticipant(conversation.participantIds, request.auth.userId);
    await this.consumeMessageQuota(request.auth.userId);
    conversation.messages.push({ senderId: request.auth.userId, text, sentAt: new Date() } as never);
    conversation.lastMessageAt = new Date();
    conversation.unreadCountByUser ??= new Map<string, number>();
    const recipientId = conversation.ownerId === request.auth.userId ? conversation.buyerId : conversation.ownerId;
    conversation.unreadCountByUser.set(recipientId, (conversation.unreadCountByUser.get(recipientId) || 0) + 1);
    await conversation.save();
    return { success: true, message: conversation.messages[conversation.messages.length - 1] };
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
    throw new TooManyRequestsException('You are sending messages too quickly. Try again in a minute.');
  }

  private assertParticipant(participants: string[], userId: string) {
    if (!participants.includes(userId)) throw new ForbiddenException('You do not have access to this conversation.');
  }

  private isObjectId(value: string) {
    return /^[a-f\d]{24}$/i.test(value);
  }
}
