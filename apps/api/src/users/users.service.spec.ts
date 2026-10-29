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
    model.findOneAndUpdate.mockReturnValue({ lean: () => ({ exec: async () => ({
      clerkUserId: 'clerk_user', name: '', email: '', phone: '', city: '', about: '',
    }) }) });
    await expect(service.getMyProfile('clerk_user')).resolves.toEqual({
      name: '', email: '', phone: '', city: '', about: '',
    });
    expect(model.findOne).toHaveBeenCalledWith({ clerkUserId: 'clerk_user' });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { clerkUserId: 'clerk_user' },
      { $setOnInsert: { clerkUserId: 'clerk_user', name: '', email: '' } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  });

  it('seeds a first profile from verified identity claims without replacing a saved profile', async () => {
    model.findOne.mockReturnValue({ lean: () => ({ exec: async () => null }) });
    model.findOneAndUpdate.mockReturnValue({ lean: () => ({ exec: async () => ({
      clerkUserId: 'clerk_user', name: 'Verified Person', email: 'verified@example.com',
      phone: '', city: '', about: '',
    }) }) });
    await expect(service.getMyProfile('clerk_user', {
      name: ' Verified Person ', email: ' VERIFIED@Example.com ',
    })).resolves.toEqual({
      name: 'Verified Person', email: 'verified@example.com', phone: '', city: '', about: '',
    });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { clerkUserId: 'clerk_user' },
      { $setOnInsert: { clerkUserId: 'clerk_user', name: 'Verified Person', email: 'verified@example.com' } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
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

  it('backfills blank identity fields from verified Clerk data without overwriting saved values', async () => {
    model.findOne.mockReturnValue({ lean: () => ({ exec: async () => ({
      clerkUserId: 'clerk_user', name: '', email: '', phone: '555', city: 'Rudrapur', about: 'Saved bio',
    }) }) });
    model.findOneAndUpdate.mockReturnValue({ lean: () => ({ exec: async () => ({
      clerkUserId: 'clerk_user', name: 'Verified Person', email: 'verified@example.com',
      phone: '555', city: 'Rudrapur', about: 'Saved bio',
    }) }) });
    await expect(service.getMyProfile('clerk_user', {
      name: 'Verified Person', email: 'VERIFIED@example.com',
    })).resolves.toEqual({
      name: 'Verified Person', email: 'verified@example.com', phone: '555', city: 'Rudrapur', about: 'Saved bio',
    });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { clerkUserId: 'clerk_user' },
      { $set: { name: 'Verified Person', email: 'verified@example.com' } },
      { new: true, runValidators: true },
    );
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
});
