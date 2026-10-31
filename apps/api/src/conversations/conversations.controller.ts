import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Query, Req, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Model, Types } from 'mongoose';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { Property } from '../properties/schemas/property.schema';
import { Conversation } from './schemas/conversation.schema';
import { MessageRateLimit } from './schemas/message-rate-limit.schema';
import { Message } from './schemas/message.schema';
import { PropertyOffer } from './schemas/property-offer.schema';

type RequestWithAuth = { auth: { userId: string } };
class SendMessageDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(1) @MaxLength(4000) text!: string;
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
@UseGuards(ClerkAuthGuard)
export class ConversationsController {
  constructor(
    @InjectModel(Conversation.name) private readonly conversations: Model<Conversation>,
    @InjectModel(Property.name) private readonly properties: Model<Property>,
    @InjectModel(MessageRateLimit.name) private readonly messageRateLimits: Model<MessageRateLimit>,
    @InjectModel(Message.name) private readonly messages: Model<Message>,
    @InjectModel(PropertyOffer.name) private readonly offers: Model<PropertyOffer>,
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
    return {
      conversationId,
      propertyId: conversation.propertyId,
      propertyTitle: conversation.propertyTitle,
      messages: page,
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

  @Post(':conversationId/messages')
  async sendMessage(@Req() request: RequestWithAuth, @Param('conversationId') conversationId: string, @Body() body: SendMessageDto) {
    if (!this.isObjectId(conversationId)) throw new NotFoundException('Conversation not found.');
    const text = body.text?.trim();
    if (!text) throw new BadRequestException('Write a message first.');
    const conversation = await this.conversations.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException('Conversation not found.');
    this.assertParticipant(conversation.participantIds, request.auth.userId);
    await this.consumeMessageQuota(request.auth.userId);
    const recipientId = conversation.ownerId === request.auth.userId ? conversation.buyerId : conversation.ownerId;
    const sentAt = new Date();
    const message = { _id: new Types.ObjectId(), senderId: request.auth.userId, text, sentAt };
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
      { $setOnInsert: { conversationId: new Types.ObjectId(conversationId), senderId: message.senderId, text: message.text, sentAt } },
      { upsert: true },
    ).exec();
    if (result.matchedCount !== 1) throw new NotFoundException('Conversation not found.');
    return { success: true, message };
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
  async createOffer(@Req() request: RequestWithAuth, @Param('conversationId') conversationId: string, @Body() body: CreateOfferDto) {
    if (!this.isObjectId(conversationId)) throw new NotFoundException('Conversation not found.');
    const conversation = await this.conversations.findById(conversationId).exec();
    if (!conversation) throw new NotFoundException('Conversation not found.');
    this.assertParticipant(conversation.participantIds, request.auth.userId);
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
    return { success: true, offer };
  }

  @Post(':conversationId/offers/:offerId/counter')
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
    this.assertParticipant(conversation.participantIds, request.auth.userId);
    const previous = await this.offers.findOne({
      _id: new Types.ObjectId(offerId),
      conversationId: new Types.ObjectId(conversationId),
    }).exec();
    if (!previous) throw new NotFoundException('Offer not found.');
    if (previous.recipientId !== request.auth.userId || previous.status !== 'pending') {
      throw new ForbiddenException('Only the recipient can counter a pending offer.');
    }
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
    return { success: true, offer: counter };
  }

  @Patch(':conversationId/offers/:offerId/respond')
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
