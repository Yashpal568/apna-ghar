import { UsersService } from './users.service';

describe('UsersService', () => {
  const model = { findOne: jest.fn(), findOneAndUpdate: jest.fn() };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(model as never);
  });

  it('returns an empty profile for a new account', async () => {
    model.findOne.mockReturnValue({ lean: () => ({ exec: async () => null }) });
    await expect(service.getMyProfile('clerk_user')).resolves.toEqual({
      name: '', email: '', phone: '', city: '', about: '',
    });
    expect(model.findOne).toHaveBeenCalledWith({ clerkUserId: 'clerk_user' });
  });

  it('returns only public profile fields', async () => {
    model.findOne.mockReturnValue({ lean: () => ({ exec: async () => ({
      clerkUserId: 'clerk_user', name: 'Test User', email: 'test@example.com',
      phone: '', city: '', about: '', internalFlag: true,
    }) }) });
    await expect(service.getMyProfile('clerk_user')).resolves.toEqual({
      name: 'Test User', email: 'test@example.com', phone: '', city: '', about: '',
    });
  });

  it('normalizes profile values and scopes the upsert to the verified Clerk user ID', async () => {
    model.findOneAndUpdate.mockReturnValue({ lean: () => ({ exec: async () => ({
      clerkUserId: 'clerk_user', name: 'Test User', email: 'test@example.com',
      phone: '123', city: 'Rudrapur', about: 'Hello',
    }) }) });
    await service.saveMyProfile('clerk_user', {
      name: ' Test User ', email: ' TEST@Example.com ', phone: ' 123 ',
      city: ' Rudrapur ', about: ' Hello ',
    });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { clerkUserId: 'clerk_user' },
      { $set: { name: 'Test User', email: 'test@example.com', phone: '123', city: 'Rudrapur', about: 'Hello' }, $setOnInsert: { clerkUserId: 'clerk_user' } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  });

  it('syncs Clerk identity without overwriting a user-edited display name', async () => {
    model.findOne.mockReturnValue({ lean: () => ({ exec: async () => ({ name: 'Chosen display name', email: 'old@example.com' }) }) });
    model.findOneAndUpdate.mockReturnValue({ lean: () => ({ exec: async () => ({
      clerkUserId: 'clerk_user', name: 'Chosen display name', email: 'new@example.com',
      phone: '', city: '', about: '',
    }) }) });
    await expect(service.syncClerkIdentity('clerk_user', { name: 'Provider Name', email: 'NEW@example.com' })).resolves.toEqual({
      name: 'Chosen display name', email: 'new@example.com', phone: '', city: '', about: '',
    });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { clerkUserId: 'clerk_user' },
      { $set: { name: 'Chosen display name', email: 'new@example.com' }, $setOnInsert: { clerkUserId: 'clerk_user' } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  });

});