import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { ConversationsController } from './conversations.controller';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Property.name, schema: PropertySchema },
    ]),
  ],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
