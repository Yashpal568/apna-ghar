import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertyAuthGuard } from './property-auth.guard';
import { Property, PropertySchema } from './schemas/property.schema';
import { SavedProperty, SavedPropertySchema } from './schemas/saved-property.schema';
import { SavedPropertiesController } from './saved-properties.controller';
import { SavedPropertiesService } from './saved-properties.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Property.name, schema: PropertySchema }, { name: SavedProperty.name, schema: SavedPropertySchema }])],
  controllers: [PropertiesController, SavedPropertiesController],
  providers: [PropertiesService, SavedPropertiesService, PropertyAuthGuard],
})
export class PropertiesModule {}
