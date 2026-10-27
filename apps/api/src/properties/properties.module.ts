import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertyAuthGuard } from './property-auth.guard';
import { Property, PropertySchema } from './schemas/property.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Property.name, schema: PropertySchema }])],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertyAuthGuard],
})
export class PropertiesModule {}
