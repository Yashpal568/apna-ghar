import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { MessageRateLimit, MessageRateLimitSchema } from './schemas/message-rate-limit.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { ConversationsController } from './conversations.controller';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: MessageRateLimit.name, schema: MessageRateLimitSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Property.name, schema: PropertySchema },
    ]),
  ],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
