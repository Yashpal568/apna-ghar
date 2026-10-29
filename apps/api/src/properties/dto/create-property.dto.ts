import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

class PropertyLocationDto {
  @IsString() @MaxLength(100) state!: string;
  @IsString() @MaxLength(100) city!: string;
  @IsOptional() @IsString() @MaxLength(120) locality?: string;
  @IsOptional() @IsString() @MaxLength(240) addressText?: string;
}

export class CreatePropertyDto {
  @IsString() @MaxLength(140) title!: string;
  @IsString() @MaxLength(5000) description!: string;
  @IsOptional() @IsString() @MaxLength(30) contactPhone?: string;
  @IsString() @MaxLength(80) categoryId!: string;
  @IsIn(['sale', 'rent']) listingType!: 'sale' | 'rent';
  @Type(() => Number) @IsNumber() @Min(0) priceAmount!: number;
  @ValidateNested() @Type(() => PropertyLocationDto) location!: PropertyLocationDto;
  @Type(() => Number) @IsNumber() @Min(1) areaValue!: number;
  @IsIn(['sqft', 'sqm', 'acre']) areaUnit!: 'sqft' | 'sqm' | 'acre';
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) bedrooms?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) bathrooms?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) parkingCount?: number;
  @IsOptional() @IsIn(['unfurnished', 'semi-furnished', 'furnished', 'unknown']) furnishing?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  @IsOptional() @IsBoolean() isNegotiable?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) imageUrls?: string[];
}
