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

  async getMyProfile(clerkUserId: string) {
    const profile = await this.profiles.findOne({ clerkUserId }).lean().exec();
    if (profile) return this.toPublicProfile(profile);
    return { name: '', email: '', phone: '', city: '', about: '' };
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
