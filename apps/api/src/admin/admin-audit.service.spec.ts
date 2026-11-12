import { AdminAuditService } from './admin-audit.service';

describe('AdminAuditService', () => {
  let service: AdminAuditService;
  let model: {
    create: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    model = {
      create: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
    };
    service = new AdminAuditService(model as never);
  });

  it('records an audit log with admin ID, action, target, and metadata', async () => {
    model.create.mockResolvedValue({ _id: 'log_123' });
    await service.recordLog(
      'admin_1',
      'user_suspend',
      'user',
      'user_2',
      'Suspended due to spam',
      { previousStatus: 'active' },
    );

    expect(model.create).toHaveBeenCalledWith({
      adminUserId: 'admin_1',
      action: 'user_suspend',
      targetType: 'user',
      targetId: 'user_2',
      reason: 'Suspended due to spam',
      details: { previousStatus: 'active' },
    });
  });

  it('lists paginated audit logs filtered by targetType', async () => {
    const rows = [{ _id: 'log_1', action: 'property_hide' }];
    model.find.mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            lean: () => ({
              exec: async () => rows,
            }),
          }),
        }),
      }),
    });

    const result = await service.listLogs({ targetType: 'property', page: 1, limit: 10 });
    expect(result.items).toEqual(rows);
    expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1, pages: 1 });
  });
});
