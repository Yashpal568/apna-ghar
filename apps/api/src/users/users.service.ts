import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserProfile, UserProfileDocument } from './schemas/user-profile.schema';

export type ProfileInput = {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  about?: string;
};

@Injectable()
export class UsersService {
  constructor(@InjectModel(UserProfile.name) private readonly profiles: Model<UserProfileDocument>) {}

  async getMyProfile(clerkUserId: string, identity: { name?: string; email?: string } = {}) {
    const existing = await this.profiles.findOne({ clerkUserId }).lean().exec();
    if (existing) {
      const backfill: Record<string, string> = {};
      if (!String(existing.name ?? '').trim() && identity.name?.trim()) backfill.name = identity.name.trim().slice(0, 100);
      if (!String(existing.email ?? '').trim() && identity.email?.trim()) backfill.email = identity.email.trim().toLowerCase().slice(0, 254);
      if (!Object.keys(backfill).length) return this.toPublicProfile(existing);
      const synced = await this.profiles.findOneAndUpdate(
        { clerkUserId },
        { $set: backfill },
        { new: true, runValidators: true },
      ).lean().exec();
      return this.toPublicProfile(synced ?? existing);
    }

    // Only use fields from server-verified Clerk identity; never accept an identity ID from the request body.
    const seed = {
      clerkUserId,
      name: (identity.name ?? '').trim().slice(0, 100),
      email: (identity.email ?? '').trim().toLowerCase().slice(0, 254),
    };
    const profile = await this.profiles.findOneAndUpdate(
      { clerkUserId },
      { $setOnInsert: seed },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean().exec();
    if (!profile) throw new Error('Profile could not be initialized. Please retry.');
    return this.toPublicProfile(profile);
  }

  async syncClerkIdentity(clerkUserId: string, identity: { name?: string; email?: string }) {
    const existing = await this.profiles.findOne({ clerkUserId }).lean().exec();
    const existingName = typeof existing?.name === 'string' ? existing.name.trim() : '';
    const existingEmail = typeof existing?.email === 'string' ? existing.email.trim().toLowerCase() : '';
    const name = existingName || identity.name?.trim() || '';
    const email = identity.email?.trim().toLowerCase() || existingEmail;
    const profile = await this.profiles.findOneAndUpdate(
      { clerkUserId },
      { $set: { name, email }, $setOnInsert: { clerkUserId } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean().exec();
    if (!profile) throw new Error('Account profile could not be synchronized.');
    return this.toPublicProfile(profile);
  }

  async saveMyProfile(clerkUserId: string, input: ProfileInput) {
    const clean = {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() } : {}),
      ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
      ...(input.city !== undefined ? { city: input.city.trim() } : {}),
      ...(input.about !== undefined ? { about: input.about.trim() } : {}),
    };
    const profile = await this.profiles.findOneAndUpdate(
      { clerkUserId },
      { $set: clean, $setOnInsert: { clerkUserId } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean().exec();
    if (!profile) throw new Error('Profile could not be saved. Please retry.');
    return this.toPublicProfile(profile);
  }

  private toPublicProfile(profile: Record<string, unknown>) {
    return {
      name: String(profile.name ?? ''),
      email: String(profile.email ?? ''),
      phone: String(profile.phone ?? ''),
      city: String(profile.city ?? ''),
      about: String(profile.about ?? ''),
    };
  }
}
