import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ConversationsController } from '../src/conversations/conversations.controller';
import { ClerkAuthGuard } from '../src/auth/clerk-auth.guard';
import { Conversation } from '../src/conversations/schemas/conversation.schema';
import { Property } from '../src/properties/schemas/property.schema';
import { MessageRateLimit } from '../src/conversations/schemas/message-rate-limit.schema';
import { Message } from '../src/conversations/schemas/message.schema';
import { PropertyOffer } from '../src/conversations/schemas/property-offer.schema';

function chainQuery<T>(value: T) {
  return {
    lean: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value),
  };
}

describe('Conversations & Messaging Module Endpoints (e2e)', () => {
  let app: INestApplication;
  let currentUserId: string = 'user_buyer_1';
  let isAuthenticated: boolean = true;

  const validConversationId = '507f1f77bcf86cd799439011';
  const otherConversationId = '507f1f77bcf86cd799439099';
  const validPropertyId = '507f1f77bcf86cd799439022';
  const validOfferId = '507f1f77bcf86cd799439033';

  const mockConversationDoc = {
    _id: new Types.ObjectId(validConversationId),
    propertyId: validPropertyId,
    propertyTitle: 'Spacious 3BHK Penthouse',
    propertySlug: 'spacious-3bhk-penthouse',
    ownerId: 'user_owner_1',
    buyerId: 'user_buyer_1',
    participantIds: ['user_owner_1', 'user_buyer_1'],
    messages: [
      {
        _id: new Types.ObjectId('507f1f77bcf86cd799439044'),
        senderId: 'user_buyer_1',
        text: 'Is this available for immediate possession?',
        sentAt: new Date(),
      },
    ],
    unreadCountByUser: new Map([
      ['user_owner_1', 1],
      ['user_buyer_1', 0],
    ]),
    lastMessageAt: new Date(),
  };

  const mockPropertyDoc = {
    _id: new Types.ObjectId(validPropertyId),
    title: 'Spacious 3BHK Penthouse',
    slug: 'spacious-3bhk-penthouse',
    ownerId: 'user_owner_1',
    priceAmount: 15000000,
    status: 'active',
    deletedAt: null,
  };

  const mockConversationModel = {
    find: jest.fn().mockImplementation((filter: { participantIds?: string }) => {
      if (filter.participantIds === 'user_buyer_1' || filter.participantIds === 'user_owner_1') {
        return chainQuery([mockConversationDoc]);
      }
      return chainQuery([]);
    }),
    findOne: jest.fn().mockImplementation((filter: { _id?: Types.ObjectId; participantIds?: string; propertyId?: string; buyerId?: string }) => {
      if (filter.propertyId === validPropertyId && filter.buyerId === 'user_buyer_1') {
        return {
          ...mockConversationDoc,
          exec: jest.fn().mockResolvedValue(mockConversationDoc),
        };
      }
      if (filter._id && filter.participantIds) {
        if (String(filter._id) === validConversationId && (filter.participantIds === 'user_buyer_1' || filter.participantIds === 'user_owner_1')) {
          return {
            ...mockConversationDoc,
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockConversationDoc),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(null),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
    }),
    updateOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
    }),
    create: jest.fn().mockResolvedValue(mockConversationDoc),
    aggregate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([{ messages: mockConversationDoc.messages }]),
    }),
  };

  const mockPropertyModel = {
    findOne: jest.fn().mockReturnValue(chainQuery(mockPropertyDoc)),
    findById: jest.fn().mockReturnValue(chainQuery(mockPropertyDoc)),
  };

  const mockRateLimitModel = {
    findOneAndUpdate: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ count: 1 }),
    }),
  };

  const mockMessageModel = {
    find: jest.fn().mockReturnValue(chainQuery(mockConversationDoc.messages)),
    updateOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ upsertedCount: 1 }),
    }),
  };

  const mockOfferModel = {
    find: jest.fn().mockReturnValue(chainQuery([
      {
        _id: new Types.ObjectId(validOfferId),
        conversationId: new Types.ObjectId(validConversationId),
        amount: 14500000,
        askingPriceAtOffer: 15000000,
        senderId: 'user_buyer_1',
        recipientId: 'user_owner_1',
        status: 'pending',
      },
    ])),
    create: jest.fn().mockImplementation(async (data: unknown) => ({
      _id: new Types.ObjectId(validOfferId),
      ...(data as Record<string, unknown>),
    })),
    findOne: jest.fn().mockImplementation((filter: { _id?: Types.ObjectId; recipientId?: string }) => {
      if (filter.recipientId === 'user_owner_1') {
        return {
          _id: new Types.ObjectId(validOfferId),
          conversationId: new Types.ObjectId(validConversationId),
          amount: 14500000,
          askingPriceAtOffer: 15000000,
          senderId: 'user_buyer_1',
          recipientId: 'user_owner_1',
          status: 'pending',
          exec: jest.fn().mockResolvedValue(true),
        };
      }
      return { exec: jest.fn().mockResolvedValue(null) };
    }),
    findOneAndUpdate: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(validOfferId),
        status: 'accepted',
        senderId: 'user_buyer_1',
      }),
    }),
    updateOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ matchedCount: 1 }),
    }),
    deleteOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        { provide: getModelToken(Conversation.name), useValue: mockConversationModel },
        { provide: getModelToken(Property.name), useValue: mockPropertyModel },
        { provide: getModelToken(MessageRateLimit.name), useValue: mockRateLimitModel },
        { provide: getModelToken(Message.name), useValue: mockMessageModel },
        { provide: getModelToken(PropertyOffer.name), useValue: mockOfferModel },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp: () => { getRequest: () => { auth?: { userId: string } } } }) => {
          if (!isAuthenticated) throw new UnauthorizedException('Bearer token required');
          context.switchToHttp().getRequest().auth = { userId: currentUserId };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.listen(0);
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    currentUserId = 'user_buyer_1';
    isAuthenticated = true;
    jest.clearAllMocks();
  });

  it('1. GET /api/v1/conversations - lists current user conversations', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations`, {
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]._id).toBe(validConversationId);
    expect(mockConversationModel.find).toHaveBeenCalledWith({ participantIds: 'user_buyer_1' });
  });

  it('2. POST /api/v1/conversations/property/:propertyId - starts conversation with owner', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/property/${validPropertyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ message: 'Hello, is this still available?' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.conversationId).toBe(validConversationId);
  });

  it('3. POST /api/v1/conversations/property/:propertyId - prevents owner from messaging own property', async () => {
    currentUserId = 'user_owner_1'; // owner is attempting to start chat on their own property
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/property/${validPropertyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ message: 'Self chat' }),
    });
    expect(res.status).toBe(400);
  });

  it('4. GET /api/v1/conversations/:conversationId - returns conversation details for authorized participant', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/${validConversationId}`, {
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._id).toBe(validConversationId);
  });

  it('5. GET /api/v1/conversations/:conversationId - IDOR rejection for non-participant (404)', async () => {
    currentUserId = 'user_unrelated_stranger';
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/${validConversationId}`, {
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(404);
  });

  it('6. GET /api/v1/conversations/:conversationId/messages - gets paginated messages for participant', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/${validConversationId}/messages?limit=20`, {
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.conversationId).toBe(validConversationId);
    expect(body.messages).toHaveLength(1);
  });

  it('7. GET /api/v1/conversations/:conversationId/messages - IDOR rejection for non-participant (404)', async () => {
    currentUserId = 'user_unrelated_stranger';
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/${validConversationId}/messages`, {
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(404);
  });

  it('8. PATCH /api/v1/conversations/:conversationId/read - marks conversation as read', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/${validConversationId}/read`, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.unreadCount).toBe(0);
  });

  it('9. POST /api/v1/conversations/:conversationId/messages - sends message into conversation', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/${validConversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ text: 'I am ready to make an offer' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message.text).toBe('I am ready to make an offer');
  });

  it('10. POST /api/v1/conversations/:conversationId/messages - rejects empty text and empty attachment with 400', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/${validConversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ text: '   ' }),
    });
    expect(res.status).toBe(400);
  });

  it('11. POST /api/v1/conversations/:conversationId/messages - IDOR rejection for non-participant (404)', async () => {
    currentUserId = 'user_unrelated_stranger';
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/${validConversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ text: 'Spamming someone elses chat' }),
    });
    expect(res.status).toBe(404);
  });

  it('12. GET /api/v1/conversations/:conversationId/offers - lists negotiation offers', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/${validConversationId}/offers`, {
      headers: { Authorization: 'Bearer token' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].amount).toBe(14500000);
  });

  it('13. POST /api/v1/conversations/:conversationId/offers - buyer creates an offer', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/${validConversationId}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ amount: 14500000, message: 'Initial offer' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.offer.amount).toBe(14500000);
  });

  it('14. POST /api/v1/conversations/:conversationId/offers - prevents owner from creating initial offer (403)', async () => {
    currentUserId = 'user_owner_1'; // owner cannot make initial proposal
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/${validConversationId}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ amount: 15000000 }),
    });
    expect(res.status).toBe(403);
  });

  it('15. POST /api/v1/conversations/:conversationId/offers/:offerId/counter - owner counters offer', async () => {
    currentUserId = 'user_owner_1'; // owner responds with counter offer
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/${validConversationId}/offers/${validOfferId}/counter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ amount: 14800000, message: 'Counter proposal' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.offer.amount).toBe(14800000);
  });

  it('16. PATCH /api/v1/conversations/:conversationId/offers/:offerId/respond - accepts offer', async () => {
    currentUserId = 'user_owner_1';
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations/${validConversationId}/offers/${validOfferId}/respond`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
      body: JSON.stringify({ action: 'accept' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.offer.status).toBe('accepted');
  });

  it('17. Security: Rejects unauthenticated requests with 401', async () => {
    isAuthenticated = false;
    const res = await fetch(`${await app.getUrl()}/api/v1/conversations`);
    expect(res.status).toBe(401);
  });
});
