import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { CategoriesController } from '../src/categories/categories.controller';
import { CategoriesService } from '../src/categories/categories.service';

describe('Categories Module Endpoints (e2e)', () => {
  let app: INestApplication;

  const mockCategoriesService = {
    listActive: jest.fn().mockResolvedValue([
      { key: 'flat', label: 'Flat / Apartment', icon: '🏢', active: true, sortOrder: 1 },
      { key: 'house', label: 'Independent House', icon: '🏠', active: true, sortOrder: 2 },
      { key: 'plot', label: 'Plot / Land', icon: '📐', active: true, sortOrder: 3 },
      { key: 'commercial', label: 'Commercial Space', icon: '🏬', active: true, sortOrder: 4 },
    ]),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: mockCategoriesService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.listen(0);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('1. GET /api/v1/categories - returns active property categories publicly', async () => {
    const res = await fetch(`${await app.getUrl()}/api/v1/categories`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(4);
    expect(body[0].key).toBe('flat');
    expect(body[2].key).toBe('plot');
    expect(mockCategoriesService.listActive).toHaveBeenCalled();
  });
});
