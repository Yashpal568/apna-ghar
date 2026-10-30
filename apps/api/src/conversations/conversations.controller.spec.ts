import { BadRequestException, ForbiddenException, NotFoundException, TooManyRequestsException } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';

function chain<T>(value: T) {
  return { lean: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(value) };
}

describe('ConversationsController', () => {
  const buyer = 'user_buyer';
  const owner = 'user_owner';
  let controller: ConversationsController;
  let conversations: Record<string, jest.Mock>;
  let properties: Record<string, jest.Mock>;
  let messageRateLimits: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    conversations = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      aggregate: jest.fn(),
      updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ matchedCount: 1 }) }),
      create: jest.fn(),
    };
    properties = { findOne: jest.fn() };
    messageRateLimits = { findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ count: 1 }) }) };
    controller = new ConversationsController(conversations as never, properties as never, messageRateLimits as never);
  });

  it('lists only conversations that include the signed-in participant', async () => {
    const rows = [{ _id: 'conversation-1', participantIds: [buyer, owner] }];
    const query = chain(rows);
    conversations.find.mockReturnValue(query);
    await expect(controller.listMine({ auth: { userId: buyer } })).resolves.toEqual([{ ...rows[0], unreadCountByUser: {} }]);
    expect(conversations.find).toHaveBeenCalledWith({ participantIds: buyer });
    expect(query.sort).toHaveBeenCalledWith({ lastMessageAt: -1 });
    expect(query.limit).toHaveBeenCalledWith(100);
    expect(query.select).toHaveBeenCalledWith({ messages: { $slice: -1 } });
  });

  it('prevents an owner from starting a buyer chat on their own listing', async () => {
    const property = { _id: '507f1f77bcf86cd799439011', ownerId: owner, title: 'Owner home', slug: 'owner-home', status: 'active' };
    properties.findOne.mockReturnValue(chain(property));
    await expect(controller.startForProperty({ auth: { userId: owner } }, property._id, {})).rejects.toBeInstanceOf(BadRequestException);
    expect(conversations.create).not.toHaveBeenCalled();
  });

  it('creates one property conversation for a buyer and returns its identifier', async () => {
    const property = { _id: '507f1f77bcf86cd799439011', ownerId: owner, title: 'Family home', slug: 'family-home', status: 'active' };
    properties.findOne.mockReturnValue(chain(property));
    conversations.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    const created = { _id: 'conversation-1', propertyId: property._id, propertyTitle: property.title };
    conversations.create.mockResolvedValue(created);
    await expect(controller.startForProperty({ auth: { userId: buyer } }, property._id, {})).resolves.toEqual({
      conversationId: 'conversation-1',
      propertyId: property._id,
      propertyTitle: property.title,
    });
    expect(conversations.create).toHaveBeenCalledWith(expect.objectContaining({
      propertyId: property._id,
      ownerId: owner,
      buyerId: buyer,
      participantIds: [owner, buyer],
      messages: [],
      unreadCountByUser: expect.any(Map),
    }));
  });

  it('does not disclose paginated messages to a user who is not a participant', async () => {
    conversations.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue([{
      _id: '507f1f77bcf86cd799439011',
      participantIds: [buyer, owner],
      propertyId: 'property-1',
      propertyTitle: 'Family home',
      messages: [{ senderId: buyer, text: 'Hello', sentAt: new Date() }],
    }]) });
    await expect(controller.getMessages({ auth: { userId: 'user_stranger' } }, '507f1f77bcf86cd799439011')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns the newest page and a cursor when older messages exist', async () => {
    const messages = Array.from({ length: 4 }, (_, index) => ({
      senderId: buyer, text: 'Message ' + index, sentAt: new Date(2026, 0, index + 1),
    }));
    conversations.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue([{
      participantIds: [buyer, owner], propertyId: 'property-1', propertyTitle: 'Family home', messages,
    }]) });
    const result = await controller.getMessages({ auth: { userId: buyer } }, '507f1f77bcf86cd799439011', '2026-01-04T00:00:00.000Z', '3');
    const pipeline = conversations.aggregate.mock.calls[0][0];
    expect(pipeline[2].$project.messages.$slice[0].$filter.cond).toEqual({ $lt: ['$message.sentAt', expect.any(Date)] });
    expect(result.messages).toHaveLength(3);
    expect(result.messages[0].text).toBe('Message 1');
    expect(result.messages[2].text).toBe('Message 3');
    expect(result.hasMore).toBe(true);
    expect(result.nextBefore).toEqual(messages[1].sentAt);
    expect(conversations.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ $match: { _id: expect.anything() } }),
    ]));
  });

  it('rejects invalid message page sizes and cursors', async () => {
    await expect(controller.getMessages({ auth: { userId: buyer } }, '507f1f77bcf86cd799439011', undefined, '101'))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.getMessages({ auth: { userId: buyer } }, '507f1f77bcf86cd799439011', 'not-a-date', '50'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(conversations.aggregate).not.toHaveBeenCalled();
  });

  it('returns not found when the property is no longer active', async () => {
    properties.findOne.mockReturnValue(chain(null));
    await expect(controller.startForProperty({ auth: { userId: buyer } }, '507f1f77bcf86cd799439011', {})).rejects.toBeInstanceOf(NotFoundException);
  });
  it('stores a message from an authenticated participant and advances the conversation timestamp', async () => {
    const conversation = {
      _id: 'conversation-1',
      participantIds: [buyer, owner],
      messages: [] as Array<{ senderId: string; text: string; sentAt: Date }>,
      ownerId: owner,
      buyerId: buyer,
      unreadCountByUser: new Map<string, number>(),
      lastMessageAt: new Date('2026-01-01T00:00:00.000Z'),
      save: jest.fn().mockResolvedValue(undefined),
    };
    conversations.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(conversation) });
    const response = await controller.sendMessage({ auth: { userId: buyer } }, 'conversation-1', { text: '  Is the property available?  ' });
    expect(response.success).toBe(true);
    expect(response.message).toEqual(expect.objectContaining({ senderId: buyer, text: 'Is the property available?' }));
    expect(conversations.updateOne).toHaveBeenCalledWith(
      { _id: expect.anything(), participantIds: buyer },
      expect.objectContaining({
        $push: { messages: expect.objectContaining({ senderId: buyer, text: 'Is the property available?' }) },
        $inc: { [`unreadCountByUser.${owner}`]: 1 },
      }),
    );
  });

  it('does not allow a non-participant to send a message', async () => {
    const conversation = {
      participantIds: [buyer, owner],
      messages: [],
      save: jest.fn(),
    };
    conversations.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(conversation) });
    await expect(controller.sendMessage({ auth: { userId: 'user_stranger' } }, 'conversation-1', { text: 'Hello' }))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(conversations.updateOne).not.toHaveBeenCalled();
  });



  it('clears unread count only for an authenticated participant', async () => {
    await expect(controller.markRead({ auth: { userId: buyer } }, '507f1f77bcf86cd799439011')).resolves.toEqual({ success: true, unreadCount: 0 });
    expect(conversations.updateOne).toHaveBeenCalledWith(
      { _id: expect.anything(), participantIds: buyer },
      { $set: { [`unreadCountByUser.${buyer}`]: 0 } },
    );
  });
  it('counts the first enquiry message against the sender quota and owner unread count', async () => {
    const property = { _id: '507f1f77bcf86cd799439011', ownerId: owner, title: 'Family home', slug: 'family-home', status: 'active' };
    const conversation = {
      _id: 'conversation-1', propertyId: property._id, propertyTitle: property.title,
      messages: [] as Array<{ senderId: string; text: string; sentAt: Date }>,
      unreadCountByUser: new Map([[owner, 0], [buyer, 0]]),
      save: jest.fn().mockResolvedValue(undefined),
    };
    properties.findOne.mockReturnValue(chain(property));
    conversations.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    conversations.create.mockResolvedValue(conversation);
    await controller.startForProperty({ auth: { userId: buyer } }, property._id, { message: 'Is it available?' });
    expect(messageRateLimits.findOneAndUpdate).toHaveBeenCalled();
    expect(conversation.messages[0]).toEqual(expect.objectContaining({ senderId: buyer, text: 'Is it available?' }));
    expect(conversation.unreadCountByUser.get(owner)).toBe(1);
    expect(conversation.save).toHaveBeenCalledTimes(1);
  });

  it('blocks message sends after the shared per-user minute quota is exhausted', async () => {
    const conversation = {
      participantIds: [buyer, owner], ownerId: owner, buyerId: buyer,
      messages: [], unreadCountByUser: new Map<string, number>(), save: jest.fn(),
    };
    conversations.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(conversation) });
    messageRateLimits.findOneAndUpdate
      .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) })
      .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) })
      .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
    await expect(controller.sendMessage({ auth: { userId: buyer } }, 'conversation-1', { text: 'Hello' }))
      .rejects.toBeInstanceOf(TooManyRequestsException);
    expect(conversation.save).not.toHaveBeenCalled();
  });

});
