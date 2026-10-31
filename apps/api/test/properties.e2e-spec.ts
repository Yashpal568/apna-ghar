import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PropertiesController } from '../src/properties/properties.controller';
import { PropertiesService } from '../src/properties/properties.service';
import { PropertyAuthGuard } from '../src/properties/property-auth.guard';

describe('Properties Public API (e2e)', () => {
  let app: INestApplication;
  const sampleProperty = {
    _id: '6ae495c723896cb331116519',
    slug: 'werwtw-mvuzhfat',
    title: 'plot for sale',
    description: 'Prime residential plot',
    priceAmount: 15161312,
    currency: 'INR',
    categoryId: 'plot',
    listingType: 'sale',
    status: 'active',
    location: {
      city: 'Amritsar',
      state: 'Punjab',
      locality: 'Model Town',
      addressText: '',
    },
    imageUrls: ['https://res.cloudinary.com/example/image/upload/sample.png'],
    viewsCount: 10,
    publishedAt: new Date('2026-10-30T13:04:07.349Z'),
    deletedAt: null,
  };

  const propertiesServiceMock = {
    findPublicBySlugOrId: jest.fn().mockImplementation(async (identifier: string) => {
      if (!identifier || typeof identifier !== 'string') return null;
      const clean = identifier.trim().toLowerCase();
      if (clean === 'undefined' || clean === 'null' || clean === '') return null;
      if (clean === sampleProperty.slug || clean === sampleProperty._id) {
        return sampleProperty;
      }
      return null;
    }),
    list: jest.fn().mockResolvedValue({
      items: [sampleProperty],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        { provide: PropertiesService, useValue: propertiesServiceMock },
        { provide: ConfigService, useValue: { get: () => 'test' } },
      ],
    })
      .overrideGuard(PropertyAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.listen(0);
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches a public property by valid slug', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/properties/werwtw-mvuzhfat`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(expect.objectContaining({
      _id: '6ae495c723896cb331116519',
      slug: 'werwtw-mvuzhfat',
      title: 'plot for sale',
      priceAmount: 15161312,
    }));
    expect(propertiesServiceMock.findPublicBySlugOrId).toHaveBeenCalledWith('werwtw-mvuzhfat');
  });

  it('fetches a public property by valid MongoDB ObjectId', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/properties/6ae495c723896cb331116519`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(expect.objectContaining({
      _id: '6ae495c723896cb331116519',
      slug: 'werwtw-mvuzhfat',
    }));
    expect(propertiesServiceMock.findPublicBySlugOrId).toHaveBeenCalledWith('6ae495c723896cb331116519');
  });

  it('returns 404 when property slug does not exist', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/properties/unknown-slug-123`);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.message).toBe('Property not found');
  });

  it('rejects literal "undefined" identifier with 404 without querying database', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/properties/undefined`);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.message).toBe('Property not found');
    expect(propertiesServiceMock.findPublicBySlugOrId).not.toHaveBeenCalled();
  });

  it('rejects literal "null" identifier with 404 without querying database', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/properties/null`);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.message).toBe('Property not found');
    expect(propertiesServiceMock.findPublicBySlugOrId).not.toHaveBeenCalled();
  });

  it('lists public properties with pagination', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/properties?page=1&limit=20`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });
});
