import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { UserProfile, UserProfileSchema } from '../users/schemas/user-profile.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { PropertyReport, PropertyReportSchema } from '../properties/schemas/property-report.schema';
import { PropertyCategory, PropertyCategorySchema } from '../categories/schemas/property-category.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminController } from './admin.controller';
import { AdminAuthGuard } from '../properties/admin-auth.guard';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: Property.name, schema: PropertySchema },
      { name: PropertyReport.name, schema: PropertyReportSchema },
      { name: PropertyCategory.name, schema: PropertyCategorySchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminAuditService, AdminAuthGuard],
  exports: [AdminService, AdminAuditService, AdminAuthGuard],
})
export class AdminModule {}
