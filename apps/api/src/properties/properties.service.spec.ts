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

  it('scopes visibility changes to the owner and maps hidden state server-side', async () => {
    const row = { _id: '507f1f77bcf86cd799439011', ownerId: 'user_owner', status: 'hidden_by_owner' };
    model.findOneAndUpdate.mockReturnValue(query(row));
    await expect(service.setVisibilityMine('user_owner', '507f1f77bcf86cd799439011', false)).resolves.toBe(row);
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: '507f1f77bcf86cd799439011', ownerId: 'user_owner', deletedAt: null },
      { $set: { status: 'hidden_by_owner' } },
      { new: true, runValidators: true },
    );
  });

  it('soft-deletes only the requesting owner\'s listing', async () => {
    model.findOneAndUpdate.mockReturnValue(query({ _id: '507f1f77bcf86cd799439011' }));
    await service.removeMine('user_owner', '507f1f77bcf86cd799439011');
    const [filter, update, options] = model.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ _id: '507f1f77bcf86cd799439011', ownerId: 'user_owner', deletedAt: null });
    expect(update.$set.status).toBe('deleted');
    expect(update.$set.deletedAt).toBeInstanceOf(Date);
    expect(options).toEqual({ new: true });
  });

});
