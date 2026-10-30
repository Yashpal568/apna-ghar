import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Model } from 'mongoose';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { Property } from '../properties/schemas/property.schema';
import { Conversation } from './schemas/conversation.schema';

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
  ) {}

  @Get()
  async listMine(@Req() request: RequestWithAuth) {
    const rows = await this.conversations.find({ participantIds: request.auth.userId })
      .sort({ lastMessageAt: -1 }).limit(100).lean().exec();
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
  async getMessages(@Req() request: RequestWithAuth, @Param('conversationId') conversationId: string) {
    const conversation = await this.conversations.findById(conversationId).lean().exec();
    if (!conversation) throw new NotFoundException('Conversation not found.');
    this.assertParticipant(conversation.participantIds, request.auth.userId);
    return { conversationId: String(conversation._id), propertyId: conversation.propertyId, propertyTitle: conversation.propertyTitle, messages: conversation.messages };
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
    conversation.messages.push({ senderId: request.auth.userId, text, sentAt: new Date() } as never);
    conversation.lastMessageAt = new Date();
    conversation.unreadCountByUser ??= new Map<string, number>();
    const recipientId = conversation.ownerId === request.auth.userId ? conversation.buyerId : conversation.ownerId;
    conversation.unreadCountByUser.set(recipientId, (conversation.unreadCountByUser.get(recipientId) || 0) + 1);
    await conversation.save();
    return { success: true, message: conversation.messages[conversation.messages.length - 1] };
  }

  private assertParticipant(participants: string[], userId: string) {
    if (!participants.includes(userId)) throw new ForbiddenException('You do not have access to this conversation.');
  }

  private isObjectId(value: string) {
    return /^[a-f\d]{24}$/i.test(value);
  }
}
