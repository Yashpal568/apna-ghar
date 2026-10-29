import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './health/health.module';
import { PropertiesModule } from './properties/properties.module';
import { UsersModule } from './users/users.module';
import { ConversationsModule } from './conversations/conversations.module';
import { CategoriesModule } from './categories/categories.module';

function validateEnvironment(config: Record<string, unknown>) {
  const port = Number(config.API_PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('API_PORT must be an integer between 1 and 65535.');
  }
  const mongoUri = config.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/apna_ghar';
  if (typeof mongoUri !== 'string' || !/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection URI.');
  }
  return { ...config, API_PORT: String(port), MONGODB_URI: mongoUri };
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 5000,
      }),
    }),
    HealthModule,
    PropertiesModule,
    UsersModule,
    ConversationsModule,
    CategoriesModule,
  ],
})
export class AppModule {}
