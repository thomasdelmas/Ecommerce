import {
  jest,
  describe,
  expect,
  beforeEach,
  it,
  beforeAll,
  afterAll,
} from '@jest/globals';
import ProductService from '../product/product.service';
import type {
  CreateProductsPayload,
  IProductDBRepository,
  IProduct,
  IProductCacheRepository,
  IProductFilter,
} from '../product/product.types';
import sha1 from 'sha1';

describe('ProductService', () => {
  let productDBRepository: jest.Mocked<IProductDBRepository>;
  let productCacheRepository: jest.Mocked<IProductCacheRepository>;
  let productService: ProductService;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    productDBRepository = {
      getProductByName: jest.fn(),
      createProducts: jest.fn(),
      getProductById: jest.fn(),
      getProductsWithFilter: jest.fn(),
    };
    productCacheRepository = {
      getEntry: jest.fn(),
      createEntry: jest.fn(),
    };
    productService = new ProductService(
      productDBRepository,
      productCacheRepository,
    );
  });

  describe('createProducts', () => {
    it('should create all products when names are unique', async () => {
      const inputs: CreateProductsPayload[] = [
        {
          name: 'T-shirt blue',
          category: 'T-shirt',
          price: 33.5,
          stock: 5,
        },
        {
          name: 'T-shirt green',
          category: 'T-shirt',
          price: 34.0,
          stock: 10,
        },
      ];
      const createdProduct: IProduct[] = [
        {
          id: 'ffffffffffffffffffffffff',
          name: 'T-shirt blue',
          category: 'T-shirt',
          price: 33.5,
          stock: 5,
          createdAt: Date.now(),
          currency: 'euro',
        },
        {
          id: 'gggggggggggggggggggggggg',
          name: 'T-shirt green',
          category: 'T-shirt',
          price: 34.0,
          stock: 10,
          createdAt: Date.now(),
          currency: 'euro',
        },
      ];

      productDBRepository.getProductByName.mockResolvedValue(null);
      productDBRepository.createProducts.mockResolvedValue(createdProduct);

      const result = await productService.createProducts(inputs);

      expect(productDBRepository.getProductByName).toHaveBeenCalledTimes(2);
      expect(productDBRepository.createProducts).toHaveBeenCalledTimes(1);
      expect(result.failed).toHaveLength(0);
      expect(result.createdProducts).toHaveLength(2);
    });

    it('should skip products with existing names in db', async () => {
      const inputs: CreateProductsPayload[] = [
        {
          name: 'T-shirt blue',
          category: 'T-shirt',
          price: 33.5,
          stock: 5,
        },
        {
          name: 'T-shirt green',
          category: 'T-shirt',
          price: 34.0,
          stock: 10,
        },
      ];

      productDBRepository.getProductByName
        .mockResolvedValueOnce({} as IProduct)
        .mockResolvedValueOnce(null);

      productDBRepository.createProducts.mockResolvedValue([
        {
          id: 'ffffffffffffffffffffffff',
          createdAt: Date.now(),
          name: 'T-shirt green',
          category: 'T-shirt',
          currency: 'euro',
          price: 34.0,
          stock: 10,
        },
      ]);

      const result = await productService.createProducts(inputs);

      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].input.name).toBe('T-shirt blue');
      expect(result.createdProducts).toHaveLength(1);
      expect(result.createdProducts?.[0].name).toBe('T-shirt green');
    });

    it('should return only failures if all products exist', async () => {
      const inputs: CreateProductsPayload[] = [
        {
          name: 'T-shirt blue',
          category: 'T-shirt',
          price: 33.5,
          stock: 5,
        },
        {
          name: 'T-shirt green',
          category: 'T-shirt',
          price: 34.0,
          stock: 10,
        },
      ];

      productDBRepository.getProductByName.mockResolvedValue({} as IProduct);

      const result = await productService.createProducts(inputs);

      expect(productDBRepository.createProducts).not.toHaveBeenCalled();
      expect(result.createdProducts).toStrictEqual([]);
      expect(result.failed).toHaveLength(2);
      expect(result.failed[0].reason).toBe('Product name already exist');
    });

    it('should mark duplicate input names as failed', async () => {
      const inputs: CreateProductsPayload[] = [
        {
          name: 'T-shirt blue',
          category: 'T-shirt',
          price: 33.5,
          stock: 5,
        },
        {
          name: 'T-shirt blue',
          category: 'T-shirt',
          price: 34.0,
          stock: 10,
        },
      ];

      productDBRepository.getProductByName.mockResolvedValue(null);
      productDBRepository.createProducts.mockResolvedValue([
        {
          id: 'ffffffffffffffffffffffff',
          createdAt: Date.now(),
          name: 'T-shirt blue',
          category: 'T-shirt',
          price: 33.5,
          currency: 'euro',
          stock: 5,
        },
      ]);

      const result = await productService.createProducts(inputs);

      expect(productDBRepository.getProductByName).toHaveBeenCalledTimes(1);

      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].reason).toBe('Duplicate provided product names');
      expect(result.failed[0].input.name).toBe('T-shirt blue');

      expect(result.createdProducts).toHaveLength(1);
    });
  });

  describe('getProductWithId', () => {
    it('should return product with given id', async () => {
      const product: IProduct = {
        id: 'ffffffffffffffffffffffff',
        createdAt: Date.now(),
        name: 'T-shirt blue',
        category: 'T-shirt',
        price: 33.5,
        currency: 'euro',
        stock: 5,
      };

      productDBRepository.getProductById.mockResolvedValue(product);

      const result = await productService.getProductWithId(
        'ffffffffffffffffffffffff',
      );

      expect(productDBRepository.getProductById).toHaveBeenCalledWith(
        'ffffffffffffffffffffffff',
      );
      expect(result).toBe(product);
    });

    it('should return null on null', async () => {
      productDBRepository.getProductById.mockResolvedValue(null);

      const res = await productService.getProductWithId(
        'ffffffffffffffffffffffff',
      );
      expect(productDBRepository.getProductById).toHaveBeenCalledWith(
        'ffffffffffffffffffffffff',
      );
      expect(res).toBe(null);
    });
  });

  describe('getProductsWithFilter', () => {
    it('should return products on cache hit', async () => {
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
      ];

      const filter: IProductFilter = {
        category: { in: ['T-shirt'] },
        price: { min: 20, max: 100 },
      };

      productCacheRepository.getEntry.mockResolvedValue(products);

      const res = await productService.getProductsWithFilter(filter, 1, 20);
      expect(productCacheRepository.getEntry).toHaveBeenCalledWith(
        `filterKey:${sha1(JSON.stringify(filter))}:page:${1}:productPerPage:${20}`,
      );
      expect(productDBRepository.getProductsWithFilter).not.toHaveBeenCalled();
      expect(res).toBe(products);
    });

    it('should return products from db and store in cache', async () => {
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
      ];

      const filter: IProductFilter = {
        category: { in: ['T-shirt'] },
        price: { min: 20, max: 100 },
      };

      productCacheRepository.getEntry.mockResolvedValue(null);
      productDBRepository.getProductsWithFilter.mockResolvedValue(products);
      productCacheRepository.createEntry.mockResolvedValue('someValue');

      const res = await productService.getProductsWithFilter(filter, 1, 20);
      expect(productCacheRepository.getEntry).toHaveBeenCalledWith(
        `filterKey:${sha1(JSON.stringify(filter))}:page:${1}:productPerPage:${20}`,
      );
      expect(productDBRepository.getProductsWithFilter).toHaveBeenCalledWith(
        filter,
        1,
        20,
      );
      expect(productCacheRepository.createEntry).toHaveBeenCalledWith(
        products,
        `filterKey:${sha1(JSON.stringify(filter))}:page:${1}:productPerPage:${20}`,
      );
      expect(res).toBe(products);
    });

    it('should return null if not found in db and store in cache', async () => {
      const filter: IProductFilter = {
        category: { in: ['T-shirt'] },
        price: { min: 20, max: 100 },
      };

      productCacheRepository.getEntry.mockResolvedValue(null);
      productDBRepository.getProductsWithFilter.mockResolvedValue([]);
      productCacheRepository.createEntry.mockResolvedValue('someValue');

      const res = await productService.getProductsWithFilter(filter, 1, 20);
      expect(productCacheRepository.getEntry).toHaveBeenCalledWith(
        `filterKey:${sha1(JSON.stringify(filter))}:page:${1}:productPerPage:${20}`,
      );
      expect(productDBRepository.getProductsWithFilter).toHaveBeenCalledWith(
        filter,
        1,
        20,
      );
      expect(productCacheRepository.createEntry).toHaveBeenCalledWith(
        [],
        `filterKey:${sha1(JSON.stringify(filter))}:page:${1}:productPerPage:${20}`,
      );
      expect(res).toStrictEqual([]);
    });

    it('should return fail gracefully on error', async () => {
      const filter: IProductFilter = {
        category: { in: ['T-shirt'] },
        price: { min: 20, max: 100 },
      };

      productCacheRepository.getEntry.mockResolvedValue(null);
      productDBRepository.getProductsWithFilter.mockResolvedValue([]);
      productCacheRepository.createEntry.mockImplementation(() => {
        throw new Error('Cache error');
      });

      await expect(
        productService.getProductsWithFilter(filter, 1, 20),
      ).rejects.toThrow('Cache error');
      expect(productCacheRepository.getEntry).toHaveBeenCalledWith(
        `filterKey:${sha1(JSON.stringify(filter))}:page:${1}:productPerPage:${20}`,
      );
      expect(productDBRepository.getProductsWithFilter).toHaveBeenCalledWith(
        filter,
        1,
        20,
      );
      expect(productCacheRepository.createEntry).toHaveBeenCalledWith(
        [],
        `filterKey:${sha1(JSON.stringify(filter))}:page:${1}:productPerPage:${20}`,
      );
    });
  });
});
