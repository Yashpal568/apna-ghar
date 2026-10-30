import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, IsUrl, Max, MaxLength, Min, ValidateNested } from 'class-validator';

class PropertyLocationDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(100) state!: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(100) city!: string;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(120) locality?: string;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(240) addressText?: string;
}

export class CreatePropertyDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(140) title!: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(5000) description!: string;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(100) contactName?: string;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(30) contactPhone?: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(80) categoryId!: string;
  @IsIn(['sale', 'rent']) listingType!: 'sale' | 'rent';
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100000000000) priceAmount!: number;
  @IsObject() @ValidateNested() @Type(() => PropertyLocationDto) location!: PropertyLocationDto;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) @Max(100000000) areaValue!: number;
  @IsIn(['sqft', 'sqm', 'acre']) areaUnit!: 'sqft' | 'sqm' | 'acre';
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) bedrooms?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) bathrooms?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) parkingCount?: number;
  @IsOptional() @IsIn(['unfurnished', 'semi-furnished', 'furnished', 'unknown']) furnishing?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(40) @IsString({ each: true }) @MaxLength(60, { each: true }) amenities?: string[];
  @IsOptional() @IsBoolean() isNegotiable?: boolean;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsUrl({ protocols: ['https'], require_protocol: true }, { each: true }) @MaxLength(2048, { each: true }) imageUrls?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(5) @IsUrl({ protocols: ['https'], require_protocol: true }, { each: true }) @MaxLength(2048, { each: true }) videoUrls?: string[];
}
