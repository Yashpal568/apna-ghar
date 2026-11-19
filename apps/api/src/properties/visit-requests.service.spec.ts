import { BadRequestException } from '@nestjs/common';
import { VisitRequestsService } from './visit-requests.service';

describe('VisitRequestsService', () => {
  let service: VisitRequestsService;
  let requestsModel: {
    find: jest.Mock;
    create: jest.Mock;
  };
  let propertiesModel: {
    find: jest.Mock;
    findOne: jest.Mock;
  };

  const propertyId = '507f1f77bcf86cd799439011';
  const ownerId = 'user_owner_123';
  const buyerId = 'user_buyer_456';

  beforeEach(() => {
    jest.clearAllMocks();
    requestsModel = {
      find: jest.fn(),
      create: jest.fn(),
    };
    propertiesModel = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    service = new VisitRequestsService(requestsModel as never, propertiesModel as never);
  });

  it('lists visit requests submitted by the user', async () => {
    requestsModel.find.mockReturnValue({
      sort: () => ({
        lean: () => ({
          exec: async () => [{ _id: 'req_1', userId: buyerId, propertyId }],
        }),
      }),
    });
    const result = await service.listMine(buyerId);
    expect(result).toHaveLength(1);
    expect(requestsModel.find).toHaveBeenCalledWith({ userId: buyerId });
  });

  it('lists visit requests received for owner properties', async () => {
    propertiesModel.find.mockReturnValue({
      select: () => ({
        lean: () => ({
          exec: async () => [{ _id: propertyId }],
        }),
      }),
    });
    requestsModel.find.mockReturnValue({
      sort: () => ({
        lean: () => ({
          exec: async () => [{ _id: 'req_1', propertyId }],
        }),
      }),
    });

    const result = await service.listReceived(ownerId);
    expect(result).toHaveLength(1);
    expect(propertiesModel.find).toHaveBeenCalledWith({ ownerId, deletedAt: null });
    expect(requestsModel.find).toHaveBeenCalledWith({ propertyId: { $in: [propertyId] } });
  });

  it('creates a visit request for an active property', async () => {
    propertiesModel.findOne.mockReturnValue({
      select: () => ({
        lean: () => ({
          exec: async () => ({ _id: propertyId, ownerId }),
        }),
      }),
    });
    requestsModel.create.mockResolvedValue({
      _id: 'req_1',
      userId: buyerId,
      propertyId,
      preferredDate: '2099-01-01',
      preferredTime: '14:00',
      status: 'requested',
    });

    const result = await service.create(buyerId, propertyId, {
      preferredDate: '2099-01-01',
      preferredTime: '14:00',
      message: 'Looking forward to visiting',
    });
    expect(result).toBeDefined();
    expect(requestsModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: buyerId,
        propertyId,
        preferredDate: '2099-01-01',
        preferredTime: '14:00',
        message: 'Looking forward to visiting',
        status: 'requested',
      }),
    );
  });

  it('prevents owner from scheduling a visit on their own property', async () => {
    propertiesModel.findOne.mockReturnValue({
      select: () => ({
        lean: () => ({
          exec: async () => ({ _id: propertyId, ownerId }),
        }),
      }),
    });

    await expect(
      service.create(ownerId, propertyId, {
        preferredDate: '2099-01-01',
        preferredTime: '14:00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(requestsModel.create).not.toHaveBeenCalled();
  });

  it('rejects scheduling visit requests for past dates', async () => {
    propertiesModel.findOne.mockReturnValue({
      select: () => ({
        lean: () => ({
          exec: async () => ({ _id: propertyId, ownerId }),
        }),
      }),
    });

    await expect(
      service.create(buyerId, propertyId, {
        preferredDate: '2000-01-01',
        preferredTime: '14:00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(requestsModel.create).not.toHaveBeenCalled();
  });

  describe('updateStatus', () => {
    const requestId = '507f1f77bcf86cd799439022';
    let mockVisitDoc: { userId: string; propertyId: string; status: string; save: jest.Mock };

    beforeEach(() => {
      mockVisitDoc = {
        userId: buyerId,
        propertyId,
        status: 'requested',
        save: jest.fn().mockResolvedValue(true),
      };
      (requestsModel as any).findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockVisitDoc),
      });
      propertiesModel.findOne.mockReturnValue({
        select: () => ({
          lean: () => ({
            exec: async () => ({ _id: propertyId, ownerId }),
          }),
        }),
      });
    });

    it('allows owner to confirm a visit request', async () => {
      const result = await service.updateStatus(ownerId, requestId, 'confirmed');
      expect(mockVisitDoc.status).toBe('confirmed');
      expect(mockVisitDoc.save).toHaveBeenCalled();
    });

    it('allows owner to decline a visit request', async () => {
      const result = await service.updateStatus(ownerId, requestId, 'declined');
      expect(mockVisitDoc.status).toBe('declined');
      expect(mockVisitDoc.save).toHaveBeenCalled();
    });

    it('allows buyer to cancel their own visit request', async () => {
      const result = await service.updateStatus(buyerId, requestId, 'cancelled');
      expect(mockVisitDoc.status).toBe('cancelled');
      expect(mockVisitDoc.save).toHaveBeenCalled();
    });

    it('prevents buyer from confirming the visit request', async () => {
      await expect(service.updateStatus(buyerId, requestId, 'confirmed')).rejects.toThrow();
      expect(mockVisitDoc.save).not.toHaveBeenCalled();
    });

    it('prevents stranger from updating the visit request', async () => {
      await expect(service.updateStatus('stranger_user', requestId, 'confirmed')).rejects.toThrow();
      expect(mockVisitDoc.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for invalid status', async () => {
      await expect(service.updateStatus(ownerId, requestId, 'invalid_status')).rejects.toThrow();
    });
  });
});

