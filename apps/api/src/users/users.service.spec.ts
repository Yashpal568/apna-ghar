import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UserRole } from './schemas/user-profile.schema';

describe('UsersService', () => {
  const model = { findOne: jest.fn(), findOneAndUpdate: jest.fn(), updateOne: jest.fn() };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(model as never);
  });

  it('returns a default profile for a new account with role USER and accountStatus active', async () => {
    model.findOne.mockReturnValue({ lean: () => ({ exec: async () => null }) });
    model.findOneAndUpdate.mockReturnValue({
      lean: () => ({
        exec: async () => ({
          clerkUserId: 'clerk_user',
          name: '',
          email: '',
          phone: '',
          city: '',
          about: '',
          imageUrl: '',
          role: UserRole.USER,
          accountStatus: 'active',
        }),
      }),
    });
    await expect(service.getMyProfile('clerk_user')).resolves.toEqual({
      id: 'clerk_user',
      name: '',
      email: '',
      phone: '',
      city: '',
      about: '',
      imageUrl: '',
      role: 'USER',
      accountStatus: 'active',
    });
    expect(model.findOne).toHaveBeenCalledWith({ clerkUserId: 'clerk_user' });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { clerkUserId: 'clerk_user' },
      {
        $setOnInsert: {
          clerkUserId: 'clerk_user',
          name: '',
          email: '',
          imageUrl: '',
          role: UserRole.USER,
          accountStatus: 'active',
          lastActiveAt: expect.any(Date),
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  });

  it('assigns role ADMIN if user ID is in ADMIN_CLERK_USER_IDS', async () => {
    const config = {
      get: jest.fn((key: string) => (key === 'ADMIN_CLERK_USER_IDS' ? 'clerk_admin,clerk_other' : undefined)),
    } as unknown as ConfigService;
    const adminService = new UsersService(model as never, config);

    model.findOne.mockReturnValue({ lean: () => ({ exec: async () => null }) });
    model.findOneAndUpdate.mockReturnValue({
      lean: () => ({
        exec: async () => ({
          clerkUserId: 'clerk_admin',
          name: 'Admin',
          email: 'admin@example.com',
          phone: '',
          city: '',
          about: '',
          imageUrl: '',
          role: UserRole.ADMIN,
          accountStatus: 'active',
        }),
      }),
    });

    const profile = await adminService.getMyProfile('clerk_admin');
    expect(profile.role).toBe('ADMIN');
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { clerkUserId: 'clerk_admin' },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({ role: UserRole.ADMIN }),
      }),
      expect.any(Object),
    );
  });

  it('seeds a first profile from verified identity claims without replacing a saved profile', async () => {
    model.findOne.mockReturnValue({ lean: () => ({ exec: async () => null }) });
    model.findOneAndUpdate.mockReturnValue({
      lean: () => ({
        exec: async () => ({
          clerkUserId: 'clerk_user',
          name: 'Verified Person',
          email: 'verified@example.com',
          phone: '',
          city: '',
          about: '',
          imageUrl: 'https://img.clerk.com/test.png',
          role: UserRole.USER,
          accountStatus: 'active',
        }),
      }),
    });
    await expect(
      service.getMyProfile('clerk_user', {
        name: ' Verified Person ',
        email: ' VERIFIED@Example.com ',
        imageUrl: ' https://img.clerk.com/test.png ',
      }),
    ).resolves.toEqual({
      id: 'clerk_user',
      name: 'Verified Person',
      email: 'verified@example.com',
      phone: '',
      city: '',
      about: '',
      imageUrl: 'https://img.clerk.com/test.png',
      role: 'USER',
      accountStatus: 'active',
    });
  });

  it('backfills blank identity fields from verified Clerk data without overwriting saved values', async () => {
    model.findOne.mockReturnValue({
      lean: () => ({
        exec: async () => ({
          clerkUserId: 'clerk_user',
          name: '',
          email: '',
          phone: '555',
          city: 'Rudrapur',
          about: 'Saved bio',
          imageUrl: '',
          role: UserRole.USER,
          accountStatus: 'active',
        }),
      }),
    });
    model.findOneAndUpdate.mockReturnValue({
      lean: () => ({
        exec: async () => ({
          clerkUserId: 'clerk_user',
          name: 'Verified Person',
          email: 'verified@example.com',
          phone: '555',
          city: 'Rudrapur',
          about: 'Saved bio',
          imageUrl: 'https://img.clerk.com/avatar.jpg',
          role: UserRole.USER,
          accountStatus: 'active',
        }),
      }),
    });
    await expect(
      service.getMyProfile('clerk_user', {
        name: 'Verified Person',
        email: 'VERIFIED@example.com',
        imageUrl: 'https://img.clerk.com/avatar.jpg',
      }),
    ).resolves.toEqual({
      id: 'clerk_user',
      name: 'Verified Person',
      email: 'verified@example.com',
      phone: '555',
      city: 'Rudrapur',
      about: 'Saved bio',
      imageUrl: 'https://img.clerk.com/avatar.jpg',
      role: 'USER',
      accountStatus: 'active',
    });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { clerkUserId: 'clerk_user' },
      {
        $set: {
          name: 'Verified Person',
          email: 'verified@example.com',
          imageUrl: 'https://img.clerk.com/avatar.jpg',
          lastActiveAt: expect.any(Date),
        },
      },
      { new: true, runValidators: true },
    );
  });

  it('normalizes profile values and scopes the upsert to the verified Clerk user ID', async () => {
    model.findOneAndUpdate.mockReturnValue({
      lean: () => ({
        exec: async () => ({
          clerkUserId: 'clerk_user',
          name: 'Test User',
          email: 'test@example.com',
          phone: '123',
          city: 'Rudrapur',
          about: 'Hello',
          imageUrl: '',
          role: UserRole.USER,
          accountStatus: 'active',
        }),
      }),
    });
    await service.saveMyProfile('clerk_user', {
      name: ' Test User ',
      email: ' TEST@Example.com ',
      phone: ' 123 ',
      city: ' Rudrapur ',
      about: ' Hello ',
    });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { clerkUserId: 'clerk_user' },
      {
        $set: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '123',
          city: 'Rudrapur',
          about: 'Hello',
          lastActiveAt: expect.any(Date),
        },
        $setOnInsert: {
          clerkUserId: 'clerk_user',
          role: UserRole.USER,
          accountStatus: 'active',
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  });

  it('promotes user to OWNER when promoteToOwner is called', async () => {
    model.updateOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }) });
    await service.promoteToOwner('clerk_user');
    expect(model.updateOne).toHaveBeenCalledWith(
      { clerkUserId: 'clerk_user', role: UserRole.USER },
      { $set: { role: UserRole.OWNER, lastActiveAt: expect.any(Date) } },
    );
  });
});
