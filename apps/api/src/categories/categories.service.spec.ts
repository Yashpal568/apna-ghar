import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  it('seeds defaults idempotently using upserts', async () => {
    const bulkWrite = jest.fn().mockResolvedValue({ upsertedCount: 6 });
    const service = new CategoriesService({ bulkWrite } as never);
    await service.onModuleInit();
    expect(bulkWrite).toHaveBeenCalledTimes(1);
    const operations = bulkWrite.mock.calls[0][0];
    expect(operations).toHaveLength(6);
    expect(operations.every((operation: any) => operation.updateOne.upsert === true)).toBe(true);
  });

  it('returns active categories in display order', async () => {
    const expected = [{ key: 'apartment', label: 'Apartments & flats' }];
    const exec = jest.fn().mockResolvedValue(expected);
    const query = { sort: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), lean: jest.fn().mockReturnThis(), exec };
    const find = jest.fn().mockReturnValue(query);
    const service = new CategoriesService({ find } as never);
    await expect(service.listActive()).resolves.toEqual(expected);
    expect(find).toHaveBeenCalledWith({ active: true });
    expect(query.sort).toHaveBeenCalledWith({ sortOrder: 1, label: 1 });
  });
});
