import { SavedPropertiesService } from './saved-properties.service';

describe('SavedPropertiesService', () => {
  let service: SavedPropertiesService;
  let savedModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    updateOne: jest.Mock;
    deleteOne: jest.Mock;
    bulkWrite: jest.Mock;
  };
  let propertyModel: {
    find: jest.Mock;
    findOne: jest.Mock;
  };

  const validPropId = '507f1f77bcf86cd799439011';
  const userId = 'user_clerk_123';

  beforeEach(() => {
    jest.clearAllMocks();
    savedModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      updateOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ upsertedCount: 1 }) }),
      deleteOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) }),
      bulkWrite: jest.fn().mockResolvedValue({ upsertedCount: 2 }),
    };
    propertyModel = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    service = new SavedPropertiesService(savedModel as never, propertyModel as never);
  });

  it('lists saved properties for the authenticated user and preserves order', async () => {
    savedModel.find.mockReturnValue({
      sort: () => ({
        lean: () => ({
          exec: async () => [{ userId, propertyId: validPropId, createdAt: new Date() }],
        }),
      }),
    });
    propertyModel.find.mockReturnValue({
      select: () => ({
        lean: () => ({
          exec: async () => [{ _id: validPropId, title: 'Luxury Apt', status: 'active' }],
        }),
      }),
    });

    const result = await service.list(userId);
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe(validPropId);
    expect(savedModel.find).toHaveBeenCalledWith({ userId });
  });

  it('adds an active property to saved-properties', async () => {
    propertyModel.findOne.mockReturnValue({
      select: () => ({
        lean: () => ({
          exec: async () => ({ _id: validPropId, status: 'active' }),
        }),
      }),
    });

    const result = await service.add(userId, validPropId);
    expect(result).toEqual({ saved: true, propertyId: validPropId });
    expect(savedModel.updateOne).toHaveBeenCalledWith(
      { userId, propertyId: validPropId },
      { $setOnInsert: { userId, propertyId: validPropId } },
      { upsert: true },
    );
  });

  it('returns null when attempting to save a non-existent or inactive property', async () => {
    propertyModel.findOne.mockReturnValue({
      select: () => ({
        lean: () => ({
          exec: async () => null,
        }),
      }),
    });

    const result = await service.add(userId, validPropId);
    expect(result).toBeNull();
    expect(savedModel.updateOne).not.toHaveBeenCalled();
  });

  it('removes a saved property scoped to the user', async () => {
    const result = await service.remove(userId, validPropId);
    expect(result).toEqual({ saved: false, propertyId: validPropId });
    expect(savedModel.deleteOne).toHaveBeenCalledWith({ userId, propertyId: validPropId });
  });

  it('synchronizes a batch of guest favorite property IDs idempotently', async () => {
    propertyModel.find.mockReturnValue({
      select: () => ({
        lean: () => ({
          exec: async () => [{ _id: validPropId }],
        }),
      }),
    });

    const result = await service.sync(userId, [validPropId, 'invalid-id']);
    expect(result.savedIds).toEqual([validPropId]);
    expect(result.count).toBe(1);
    expect(savedModel.bulkWrite).toHaveBeenCalledTimes(1);
  });
});
