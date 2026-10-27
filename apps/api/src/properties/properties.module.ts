import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertyAuthGuard } from './property-auth.guard';
import { Property, PropertySchema } from './schemas/property.schema';
import { SavedProperty, SavedPropertySchema } from './schemas/saved-property.schema';
import { SavedPropertiesController } from './saved-properties.controller';
import { SavedPropertiesService } from './saved-properties.service';
import { VisitRequest, VisitRequestSchema } from './schemas/visit-request.schema';
import { VisitRequestsController } from './visit-requests.controller';
import { VisitRequestsService } from './visit-requests.service';
import { PropertyReport, PropertyReportSchema } from './schemas/property-report.schema';
import { PropertyReportsController } from './property-reports.controller';
import { PropertyReportsService } from './property-reports.service';
import { AdminAuthGuard } from './admin-auth.guard';

@Module({
  imports: [MongooseModule.forFeature([{ name: Property.name, schema: PropertySchema }, { name: SavedProperty.name, schema: SavedPropertySchema }, { name: VisitRequest.name, schema: VisitRequestSchema }, { name: PropertyReport.name, schema: PropertyReportSchema }])],
  controllers: [PropertiesController, SavedPropertiesController, VisitRequestsController, PropertyReportsController],
  providers: [PropertiesService, SavedPropertiesService, VisitRequestsService, PropertyReportsService, PropertyAuthGuard, AdminAuthGuard],
})
export class PropertiesModule {}
