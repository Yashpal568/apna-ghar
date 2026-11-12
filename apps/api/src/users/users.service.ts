import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserProfile, UserProfileDocument, UserRole } from './schemas/user-profile.schema';

export type ProfileInput = {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  about?: string;
  imageUrl?: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserProfile.name) private readonly profiles: Model<UserProfileDocument>,
    @Optional() private readonly config?: ConfigService,
  ) {}

  private getAdminIds(): string[] {
    return (this.config?.get<string>('ADMIN_CLERK_USER_IDS') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  async getMyProfile(clerkUserId: string, identity: { name?: string; email?: string; imageUrl?: string } = {}) {
    const adminIds = this.getAdminIds();
    const isAdmin = adminIds.includes(clerkUserId);
    const existing = await this.profiles.findOne({ clerkUserId }).lean().exec();

    if (existing) {
      const updates: Record<string, unknown> = { lastActiveAt: new Date() };
      if (!String(existing.name ?? '').trim() && identity.name?.trim()) {
        updates.name = identity.name.trim().slice(0, 100);
      }
      if (!String(existing.email ?? '').trim() && identity.email?.trim()) {
        updates.email = identity.email.trim().toLowerCase().slice(0, 254);
      }
      if (!String(existing.imageUrl ?? '').trim() && identity.imageUrl?.trim()) {
        updates.imageUrl = identity.imageUrl.trim().slice(0, 2048);
      }
      if (isAdmin && existing.role !== UserRole.ADMIN) {
        updates.role = UserRole.ADMIN;
      }

      if (Object.keys(updates).length > 1 || updates.role) {
        const synced = await this.profiles.findOneAndUpdate(
          { clerkUserId },
          { $set: updates },
          { new: true, runValidators: true },
        ).lean().exec();
        return this.toPublicProfile(synced ?? existing);
      }
      return this.toPublicProfile(existing);
    }

    // Only use fields from server-verified Clerk identity; never accept an identity ID from the request body.
    const seed = {
      clerkUserId,
      name: (identity.name ?? '').trim().slice(0, 100),
      email: (identity.email ?? '').trim().toLowerCase().slice(0, 254),
      imageUrl: (identity.imageUrl ?? '').trim().slice(0, 2048),
      role: isAdmin ? UserRole.ADMIN : UserRole.USER,
      accountStatus: 'active',
      lastActiveAt: new Date(),
    };
    const profile = await this.profiles.findOneAndUpdate(
      { clerkUserId },
      { $setOnInsert: seed },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean().exec();
    if (!profile) throw new Error('Profile could not be initialized. Please retry.');
    return this.toPublicProfile(profile);
  }

  async syncClerkIdentity(clerkUserId: string, identity: { name?: string; email?: string; imageUrl?: string }) {
    const adminIds = this.getAdminIds();
    const isAdmin = adminIds.includes(clerkUserId);
    const existing = await this.profiles.findOne({ clerkUserId }).lean().exec();
    const existingName = typeof existing?.name === 'string' ? existing.name.trim() : '';
    const existingEmail = typeof existing?.email === 'string' ? existing.email.trim().toLowerCase() : '';
    const existingImage = typeof existing?.imageUrl === 'string' ? existing.imageUrl.trim() : '';

    const name = existingName || identity.name?.trim() || '';
    const email = identity.email?.trim().toLowerCase() || existingEmail;
    const imageUrl = identity.imageUrl?.trim() || existingImage;
    const role = isAdmin ? UserRole.ADMIN : (existing?.role ?? UserRole.USER);

    const profile = await this.profiles.findOneAndUpdate(
      { clerkUserId },
      {
        $set: { name, email, imageUrl, role, lastActiveAt: new Date() },
        $setOnInsert: { clerkUserId, accountStatus: 'active' },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean().exec();
    if (!profile) throw new Error('Account profile could not be synchronized.');
    return this.toPublicProfile(profile);
  }

  async saveMyProfile(clerkUserId: string, input: ProfileInput) {
    // Explicitly whitelist only editable profile fields; protected fields (clerkUserId, role, accountStatus) cannot be altered.
    const clean: Record<string, unknown> = {
      lastActiveAt: new Date(),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() } : {}),
      ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
      ...(input.city !== undefined ? { city: input.city.trim() } : {}),
      ...(input.about !== undefined ? { about: input.about.trim() } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl.trim() } : {}),
    };
    const profile = await this.profiles.findOneAndUpdate(
      { clerkUserId },
      { $set: clean, $setOnInsert: { clerkUserId, role: UserRole.USER, accountStatus: 'active' } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean().exec();
    if (!profile) throw new Error('Profile could not be saved. Please retry.');
    return this.toPublicProfile(profile);
  }

  async promoteToOwner(clerkUserId: string) {
    const adminIds = this.getAdminIds();
    if (adminIds.includes(clerkUserId)) return;
    await this.profiles.updateOne(
      { clerkUserId, role: UserRole.USER },
      { $set: { role: UserRole.OWNER, lastActiveAt: new Date() } },
    ).exec();
  }

  async findByClerkUserId(clerkUserId: string) {
    return this.profiles.findOne({ clerkUserId }).lean().exec();
  }

  private toPublicProfile(profile: Record<string, unknown>) {
    return {
      id: String(profile.clerkUserId ?? ''),
      name: String(profile.name ?? ''),
      email: String(profile.email ?? ''),
      phone: String(profile.phone ?? ''),
      city: String(profile.city ?? ''),
      about: String(profile.about ?? ''),
      imageUrl: String(profile.imageUrl ?? ''),
      role: String(profile.role ?? UserRole.USER),
      accountStatus: String(profile.accountStatus ?? 'active'),
    };
  }
}
