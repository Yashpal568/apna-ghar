import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UserProfile, UserProfileSchema } from './schemas/user-profile.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: UserProfile.name, schema: UserProfileSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
