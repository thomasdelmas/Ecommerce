import {
  jest,
  describe,
  expect,
  beforeEach,
  it,
  afterAll,
  beforeAll,
} from '@jest/globals';
import ProductService from '../product/product.service';
import type {
  CreateProductsPayload,
  IProductDBRepository,
  IProduct,
  IProductCacheRepository,
} from '../product/product.types';

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

    productDBRepository.getProductByName.mockResolvedValue(null);
    productDBRepository.createProducts.mockImplementation(
      async (products) => products,
    );

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
    expect(result.createdProducts).toBeNull();
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
