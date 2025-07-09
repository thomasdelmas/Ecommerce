import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterAll,
  beforeAll,
} from '@jest/globals';
import type { IProduct } from '../product/product.types';
import ProductCacheRepository from '../product/product.cache.repository';
import { RedisClientType } from '@redis/client';

describe('ProductCacheRepository', () => {
  let repository: ProductCacheRepository;
  let cacheClientMock: jest.Mocked<RedisClientType>;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    cacheClientMock = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<RedisClientType>;

    repository = new ProductCacheRepository(cacheClientMock);
  });

  describe('getEntry', () => {
    it('should call client.get() with product key and return result', async () => {
      const products: IProduct[] = [
        {
          id: 'ffffffffffffffffffffffff',
          createdAt: Date.now(),
          name: 'T-shirt blue',
          category: 'T-shirt',
          price: 33.5,
          currency: 'euro',
          stock: 5,
        },
        {
          id: 'gggggggggggggggggggggggg',
          createdAt: Date.now(),
          name: 'T-shirt green',
          category: 'T-shirt',
          price: 34.0,
          currency: 'euro',
          stock: 10,
        },
      ];

      cacheClientMock.get.mockResolvedValue(JSON.stringify(products));

      const result = await repository.getEntry('redisCacheKey');

      expect(cacheClientMock.get).toHaveBeenCalledWith('redisCacheKey');
      expect(result).toStrictEqual(products);
    });

    it('should return null if client.get() return null', async () => {
      cacheClientMock.get.mockResolvedValue(null);

      const result = await repository.getEntry('redisCacheKey');

      expect(cacheClientMock.get).toHaveBeenCalledWith('redisCacheKey');
      expect(result).toBe(null);
    });

    it('should propagate errors if db.create throws', async () => {
      cacheClientMock.get.mockImplementation(() => {
        throw new Error('Cache error');
      });

      await expect(repository.getEntry('redisCacheKey')).rejects.toThrow(
        'Cache error',
      );
    });
  });

  describe('createEntry', () => {
    it('should call client.set() with products as value and key', async () => {
      const products: IProduct[] = [
        {
          id: 'ffffffffffffffffffffffff',
          createdAt: Date.now(),
          name: 'T-shirt blue',
          category: 'T-shirt',
          price: 33.5,
          currency: 'euro',
          stock: 5,
        },
        {
          id: 'gggggggggggggggggggggggg',
          createdAt: Date.now(),
          name: 'T-shirt green',
          category: 'T-shirt',
          price: 34.0,
          currency: 'euro',
          stock: 10,
        },
      ];

      cacheClientMock.set.mockResolvedValue('done');

      const res = await repository.createEntry(products, 'cacheKeyTest');

      expect(cacheClientMock.set).toHaveBeenCalledWith(
        'cacheKeyTest',
        JSON.stringify(products),
      );
      expect(res).toBe('done');
    });

    it('should return null if client.set() returns null', async () => {
      const products: IProduct[] = [
        {
          id: 'ffffffffffffffffffffffff',
          createdAt: Date.now(),
          name: 'T-shirt blue',
          category: 'T-shirt',
          price: 33.5,
          currency: 'euro',
          stock: 5,
        },
        {
          id: 'gggggggggggggggggggggggg',
          createdAt: Date.now(),
          name: 'T-shirt green',
          category: 'T-shirt',
          price: 34.0,
          currency: 'euro',
          stock: 10,
        },
      ];

      cacheClientMock.set.mockResolvedValue(null);

      const res = await repository.createEntry(products, 'cacheKeyTest');

      expect(cacheClientMock.set).toHaveBeenCalledWith(
        'cacheKeyTest',
        JSON.stringify(products),
      );
      expect(res).toBe(null);
    });

    it('should propagate errors if client.set rejects', async () => {
      const products: IProduct[] = [
        {
          id: 'ffffffffffffffffffffffff',
          createdAt: Date.now(),
          name: 'T-shirt blue',
          category: 'T-shirt',
          price: 33.5,
          currency: 'euro',
          stock: 5,
        },
        {
          id: 'gggggggggggggggggggggggg',
          createdAt: Date.now(),
          name: 'T-shirt green',
          category: 'T-shirt',
          price: 34.0,
          currency: 'euro',
          stock: 10,
        },
      ];

      cacheClientMock.set.mockImplementation(() => {
        throw new Error('Cache error');
      });

      await expect(
        repository.createEntry(products, 'cacheKeyTest'),
      ).rejects.toThrow('Cache error');
    });
  });
});
