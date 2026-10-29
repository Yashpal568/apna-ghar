import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PropertyCategory, PropertyCategorySchema } from './schemas/property-category.schema';
@Module({
 imports: [MongooseModule.forFeature([{ name: PropertyCategory.name, schema: PropertyCategorySchema }])],
 controllers: [CategoriesController], providers: [CategoriesService], exports: [CategoriesService],
})
export class CategoriesModule {}
