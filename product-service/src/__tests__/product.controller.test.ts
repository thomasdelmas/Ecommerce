import {
  jest,
  describe,
  expect,
  beforeEach,
  beforeAll,
  it,
} from '@jest/globals';
import { Request, Response } from 'express';
import type { IProduct, IProductService } from '../product/product.types';
import ProductController from '../product/product.controller';
import {
  GetProductsWithFilteredQuery,
  GetProductWithIdParams,
} from '../types/request.types';
import { AppError } from '../errors/appError';

describe('ProductController - createProducts', () => {
  let productServiceMock: jest.Mocked<IProductService>;
  let controller: ProductController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    productServiceMock = {
      createProducts: jest.fn(),
      getProductWithId: jest.fn(),
      getProductsWithFilter: jest.fn(),
    } as unknown as jest.Mocked<IProductService>;

    controller = new ProductController(productServiceMock);

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;
  });

  describe('createProducts', () => {
    beforeAll(() => {
      req = {
        body: {
          products: [
            {
              name: 'T-shirt blue',
              category: 'T-shirt',
              price: 33.5,
              stock: 5,
            },
            {
              name: 'T-shirt vert',
              category: 'T-shirt',
              price: 36.5,
              stock: 10,
            },
          ],
        },
      };
    });

    it('should create products successfully', async () => {
      const mockProducts = {
        createdProducts: [
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
            name: 'T-shirt vert',
            category: 'T-shirt',
            price: 36.5,
            currency: 'euro',
            stock: 10,
          },
        ],
        failed: [],
      };

      productServiceMock.createProducts.mockResolvedValue(mockProducts);

      await controller.createProducts(req as Request, res as Response);

      expect(productServiceMock.createProducts).toHaveBeenCalledWith(
        req.body.products,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        creationResults: {
          createdProducts: mockProducts.createdProducts,
          failed: [],
        },
        creationCount: 2,
        rejectionCount: 0,
        message: 'Successfuly created products',
      });
    });

    it('should return error with products creation fails', async () => {
      const mockProducts = {
        createdProducts: null,
        failed: [
          {
            input: {
              name: 'T-shirt blue',
              category: 'T-shirt',
              price: 33.5,
              stock: 5,
            },
            reason: 'random',
          },
          {
            input: {
              name: 'T-shirt vert',
              category: 'T-shirt',
              price: 36.5,
              stock: 10,
            },
            reason: 'random',
          },
        ],
      };
      productServiceMock.createProducts.mockResolvedValue(mockProducts);

      try {
        await controller.createProducts(req as Request, res as Response);
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).statusCode).toBe(400);
        expect((e as AppError).code).toBe('NO_PRODUCT_CREATED');
        expect((e as AppError).message).toBe('Failed to create product');
      }
    });

    it('should return partial success with some products creation', async () => {
      const mockProducts = {
        createdProducts: [
          {
            id: 'ffffffffffffffffffffffff',
            createdAt: Date.now(),
            name: 'T-shirt blue',
            category: 'T-shirt',
            price: 33.5,
            currency: 'euro',
            stock: 5,
          },
        ],
        failed: [
          {
            input: {
              name: 'T-shirt vert',
              category: 'T-shirt',
              price: 36.5,
              stock: 10,
            },
            reason: 'random',
          },
        ],
      };
      productServiceMock.createProducts.mockResolvedValue(mockProducts);

      await controller.createProducts(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(207);
      expect(res.json).toHaveBeenCalledWith({
        creationResults: mockProducts,
        creationCount: 1,
        rejectionCount: 1,
        message: 'Succesfuly created some products',
      });
    });

    it('should handle service errors gracefully', async () => {
      productServiceMock.createProducts.mockRejectedValue(
        new Error('DB error'),
      );
      try {
        await controller.createProducts(req as Request, res as Response);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe('DB error');
      }
    });
  });

  describe('getProductWithId', () => {
    beforeEach(() => {
      req = { params: { id: 'ffffffffffffffffffffffff' } };
    });

    it('should return a product successfully', async () => {
      const mockProduct = {
        id: 'ffffffffffffffffffffffff',
        createdAt: Date.now(),
        name: 'T-shirt blue',
        category: 'T-shirt',
        price: 33.5,
        currency: 'euro',
        stock: 5,
      };

      productServiceMock.getProductWithId.mockResolvedValue(mockProduct);

      await controller.getProductWithId(
        req as Request<GetProductWithIdParams, {}, {}>,
        res as Response,
      );

      expect(productServiceMock.getProductWithId).toHaveBeenCalledWith(
        req.params?.id as string,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        product: mockProduct,
        message: 'Found product id ' + req.params?.id,
      });
    });

    it('should return error with product not found', async () => {
      productServiceMock.getProductWithId.mockResolvedValue(null);

      try {
        await controller.getProductWithId(
          req as Request<GetProductWithIdParams, {}, {}>,
          res as Response,
        );
      } catch (e) {
        expect(productServiceMock.getProductWithId).toHaveBeenCalledWith(
          req.params?.id as string,
        );
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).statusCode).toBe(404);
        expect((e as AppError).code).toBe('USER_NOT_FOUND');
        expect((e as AppError).message).toBe('User not found');
      }
    });

    it('should handle service errors gracefully', async () => {
      productServiceMock.getProductWithId.mockRejectedValue(
        new Error('DB error'),
      );
      try {
        await controller.getProductWithId(
          req as Request<GetProductWithIdParams, {}, {}>,
          res as Response,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe('DB error');
      }
    });
  });

  describe('getProductsWithFilter', () => {
    beforeEach(() => {
      req = {
        query: {
          page: 1,
          limit: 20,
        },
        filteredQuery: {
          category: { in: ['T-shirt', 'Pant'] },
          price: { min: 20, max: 100 },
        },
      } as GetProductsWithFilteredQuery;
    });

    it('should return a product successfully', async () => {
      const mockProduct = [
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
      const filteredQuery = {
        category: { in: ['T-shirt', 'Pant'] },
        price: { min: 20, max: 100 },
      };
      const page = 1;
      const limit = 20;

      productServiceMock.getProductsWithFilter.mockResolvedValue(mockProduct);

      await controller.getProductsWithFilter(
        req as Request<{}, {}, {}, GetProductsWithFilteredQuery>,
        res as Response,
      );

      expect(productServiceMock.getProductsWithFilter).toHaveBeenCalledWith(
        filteredQuery,
        page,
        limit,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        products: mockProduct,
        count: mockProduct.length,
        message: 'Successfuly found products',
      });
    });

    it('should return error with product not found', async () => {
      const mockProduct = [] as IProduct[];
      const filteredQuery = {
        category: { in: ['T-shirt', 'Pant'] },
        price: { min: 20, max: 100 },
      };
      const page = 1;
      const limit = 20;

      productServiceMock.getProductsWithFilter.mockResolvedValue(mockProduct);

      try {
        await controller.getProductsWithFilter(
          req as Request<{}, {}, {}, GetProductsWithFilteredQuery>,
          res as Response,
        );
      } catch (e) {
        expect(productServiceMock.getProductsWithFilter).toHaveBeenCalledWith(
          filteredQuery,
          page,
          limit,
        );
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).statusCode).toBe(404);
        expect((e as AppError).code).toBe('USER_NOT_FOUND');
        expect((e as AppError).message).toBe('User not found');
      }
    });

    it('should handle service errors gracefully', async () => {
      const filteredQuery = {
        category: { in: ['T-shirt', 'Pant'] },
        price: { min: 20, max: 100 },
      };
      const page = 1;
      const limit = 20;

      productServiceMock.getProductsWithFilter.mockImplementation(() => {
        throw new Error('Cache error');
      });

      try {
        await controller.getProductsWithFilter(
          req as Request<{}, {}, {}, GetProductsWithFilteredQuery>,
          res as Response,
        );
      } catch (e) {
        expect(productServiceMock.getProductsWithFilter).toHaveBeenCalledWith(
          filteredQuery,
          page,
          limit,
        );
        expect(e).toBeInstanceOf(Error);
        expect((e as Error).message).toBe('Cache error');
      }
    });
  });
});
