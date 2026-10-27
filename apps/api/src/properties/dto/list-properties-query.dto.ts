import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

export class ListPropertiesQueryDto {
  @IsOptional() @IsString() @MaxLength(120)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  q?: string;

  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(80) locality?: string;
  @IsOptional() @IsString() @MaxLength(80) categoryId?: string;
  @IsOptional() @IsIn(['sale', 'rent']) listingType?: 'sale' | 'rent';

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  minPrice?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxPrice?: number;

  @IsOptional() @IsIn(['newest', 'price_asc', 'price_desc'])
  sort: 'newest' | 'price_asc' | 'price_desc' = 'newest';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit = 20;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page = 1;
}
