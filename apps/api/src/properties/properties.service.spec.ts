import { PropertiesService } from './properties.service';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';

describe('PropertiesService owner-scoped lifecycle', () => {
  const model = {
    create: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  };
  let service: PropertiesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertiesService(model as never);
    model.findOneAndUpdate.mockReturnValue({
      select: () => ({ lean: () => ({ exec: async () => ({ _id: '507f1f77bcf86cd799439011', ownerId: 'user_a' }) }) }),
    });
  });

  it('scopes edits to both property ID and verified owner ID', async () => {
    await service.updateMine('user_a', '507f1f77bcf86cd799439011', { title: 'Updated home' } as never);
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: '507f1f77bcf86cd799439011', ownerId: 'user_a', deletedAt: null },
      { $set: { title: 'Updated home' } },
      { new: true, runValidators: true },
    );
  });

  it('returns null for malformed property IDs without querying MongoDB', async () => {
    await expect(service.updateMine('user_a', 'not-an-object-id', { title: 'Updated home' } as never)).resolves.toBeNull();
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('scopes visibility changes to the owner and maps hidden state server-side', async () => {
    await service.setVisibilityMine('user_a', '507f1f77bcf86cd799439011', false);
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: '507f1f77bcf86cd799439011', ownerId: 'user_a', deletedAt: null },
      { $set: { status: 'hidden_by_owner' } },
      { new: true, runValidators: true },
    );
  });

  it('soft-deletes only the requesting owner\'s listing', async () => {
    await service.removeMine('user_a', '507f1f77bcf86cd799439011');
    const [filter, update, options] = model.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ _id: '507f1f77bcf86cd799439011', ownerId: 'user_a', deletedAt: null });
    expect(update.$set.status).toBe('deleted');
    expect(update.$set.deletedAt).toBeInstanceOf(Date);
    expect(options).toEqual({ new: true });
  });

  it('returns paginated public listings with matching total count', async () => {
    const query = {
      page: 2, limit: 5, listingType: 'sale', city: 'Rudrapur',
      sort: 'price_asc',
    } as ListPropertiesQueryDto;
    model.find.mockReturnValue({
      sort: () => ({ skip: () => ({ limit: () => ({ select: () => ({ lean: () => ({ exec: async () => [{ title: 'Home' }] }) }) }) }) }),
    });
    model.countDocuments.mockReturnValue({ exec: async () => 7 });

    await expect(service.list(query)).resolves.toEqual({
      items: [{ title: 'Home' }],
      pagination: { page: 2, limit: 5, total: 7, pages: 2 },
    });
    expect(model.countDocuments).toHaveBeenCalledWith(expect.objectContaining({
      status: 'active', deletedAt: null, listingType: 'sale',
      'location.city': /Rudrapur/i,
    }));
  });
});
