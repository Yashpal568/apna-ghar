import { PropertyReportsService } from './property-reports.service';

function query<T>(value: T) {
  return {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value),
  };
}

describe('PropertyReportsService', () => {
  const reports = { find: jest.fn(), findOne: jest.fn(), findByIdAndUpdate: jest.fn(), create: jest.fn() };
  const properties = { findOne: jest.fn() };
  let service: PropertyReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertyReportsService(reports as never, properties as never);
  });

  it('prevents a listing owner from reporting their own property', async () => {
    properties.findOne.mockReturnValue(query({ _id: '507f1f77bcf86cd799439011', ownerId: 'user_owner' }));
    await expect(service.create('user_owner', '507f1f77bcf86cd799439011', 'scam', 'self report')).resolves.toBeNull();
    expect(reports.create).not.toHaveBeenCalled();
  });

  it('returns an existing open report instead of creating duplicate reports', async () => {
    const property = { _id: '507f1f77bcf86cd799439011', ownerId: 'user_owner' };
    const existing = { _id: 'report-1', reporterId: 'user_buyer', propertyId: property._id, status: 'open' };
    properties.findOne.mockReturnValue(query(property));
    reports.findOne.mockReturnValue(query(existing));
    await expect(service.create('user_buyer', property._id, 'misleading', 'duplicate click')).resolves.toBe(existing);
    expect(reports.findOne).toHaveBeenCalledWith({ reporterId: 'user_buyer', propertyId: property._id, status: { $in: ['open', 'reviewing'] } });
    expect(reports.create).not.toHaveBeenCalled();
  });

  it('rejects invalid property identifiers without querying MongoDB', async () => {
    await expect(service.create('user_buyer', 'invalid-id', 'other')).resolves.toBeNull();
    expect(properties.findOne).not.toHaveBeenCalled();
  });
});
