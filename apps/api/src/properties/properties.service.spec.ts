import { PropertiesService } from './properties.service';

function query<T>(value: T) {
  const chain = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value),
  };
  return chain;
}

describe('PropertiesService', () => {
  const model = {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };
  let service: PropertiesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertiesService(model as never);
  });

  it('filters public inventory to active, non-deleted listings and returns pagination metadata', async () => {
    const rows = [{ _id: 'property-1', title: 'Family home' }];
    const findQuery = query(rows);
    const countQuery = { exec: jest.fn().mockResolvedValue(21) };
    model.find.mockReturnValue(findQuery);
    model.countDocuments.mockReturnValue(countQuery);
    await expect(service.list({ page: 2, limit: 10, sort: 'newest', city: 'Rudrapur' } as never)).resolves.toEqual({
      items: rows,
      pagination: { page: 2, limit: 10, total: 21, pages: 3 },
    });
    expect(model.find).toHaveBeenCalledWith(expect.objectContaining({
      status: 'active',
      deletedAt: null,
      'location.city': expect.any(RegExp),
    }));
    expect(findQuery.skip).toHaveBeenCalledWith(10);
    expect(findQuery.limit).toHaveBeenCalledWith(10);
  });

  it('does not issue a database update for an invalid property identifier', async () => {
    await expect(service.updateMine('user_owner', 'not-an-object-id', { title: 'Changed' })).resolves.toBeNull();
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('scopes listing edits to the authenticated owner', async () => {
    const row = { _id: '507f1f77bcf86cd799439011', ownerId: 'user_owner', title: 'Updated home' };
    const updateQuery = query(row);
    model.findOneAndUpdate.mockReturnValue(updateQuery);
    await expect(service.updateMine('user_owner', '507f1f77bcf86cd799439011', { title: 'Updated home' })).resolves.toBe(row);
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: '507f1f77bcf86cd799439011', ownerId: 'user_owner', deletedAt: null },
      { $set: { title: 'Updated home' } },
      { new: true, runValidators: true },
    );
  });
});
