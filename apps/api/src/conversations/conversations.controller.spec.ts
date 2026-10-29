import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';

function chain<T>(value: T) {
  return { lean: jest.fn().mockReturnThis(), sort: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(value) };
}

describe('ConversationsController', () => {
  const buyer = 'user_buyer';
  const owner = 'user_owner';
  let controller: ConversationsController;
  let conversations: Record<string, jest.Mock>;
  let properties: Record<string, jest.Mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    conversations = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    properties = { findOne: jest.fn() };
    controller = new ConversationsController(conversations as never, properties as never);
  });

  it('lists only conversations that include the signed-in participant', async () => {
    const rows = [{ _id: 'conversation-1', participantIds: [buyer, owner] }];
    const query = chain(rows);
    conversations.find.mockReturnValue(query);
    await expect(controller.listMine({ auth: { userId: buyer } })).resolves.toBe(rows);
    expect(conversations.find).toHaveBeenCalledWith({ participantIds: buyer });
    expect(query.sort).toHaveBeenCalledWith({ lastMessageAt: -1 });
    expect(query.limit).toHaveBeenCalledWith(100);
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
    }));
  });

  it('does not disclose messages to a user who is not a participant', async () => {
    conversations.findById.mockReturnValue(chain({
      _id: 'conversation-1',
      participantIds: [buyer, owner],
      messages: [{ senderId: buyer, text: 'Hello' }],
    }));
    await expect(controller.getMessages({ auth: { userId: 'user_stranger' } }, 'conversation-1')).rejects.toBeInstanceOf(ForbiddenException);
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
      lastMessageAt: new Date('2026-01-01T00:00:00.000Z'),
      save: jest.fn().mockResolvedValue(undefined),
    };
    conversations.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(conversation) });
    const response = await controller.sendMessage({ auth: { userId: buyer } }, 'conversation-1', { text: '  Is the property available?  ' });
    expect(response.success).toBe(true);
    expect(conversation.messages).toHaveLength(1);
    expect(conversation.messages[0]).toEqual(expect.objectContaining({ senderId: buyer, text: 'Is the property available?' }));
    expect(conversation.lastMessageAt).toBeInstanceOf(Date);
    expect(conversation.save).toHaveBeenCalledTimes(1);
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
    expect(conversation.save).not.toHaveBeenCalled();
  });

});