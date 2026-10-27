import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { Property, PropertySchema } from './schemas/property.schema';

@Module({
  imports: [AuthModule, MongooseModule.forFeature([{ name: Property.name, schema: PropertySchema }])],
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
