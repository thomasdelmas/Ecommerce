import {
  jest,
  describe,
  expect,
  beforeEach,
  beforeAll,
  it,
} from '@jest/globals';
import { Request, Response } from 'express';
import type { IProductService } from '../product/product.types';
import ProductController from '../product/product.controller';

describe('ProductController - createProducts', () => {
  let productServiceMock: jest.Mocked<IProductService>;
  let controller: ProductController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    productServiceMock = {
      createProducts: jest.fn(),
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
            createdAt: Date.now(),
            name: 'T-shirt blue',
            category: 'T-shirt',
            price: 33.5,
            currency: 'euro',
            stock: 5,
          },
          {
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

      await controller.createProducts(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        creationResults: mockProducts,
        creationCount: 0,
        rejectionCount: 2,
        message: 'Failed to create products',
      });
    });

    it('should return partial success with some products creation', async () => {
      const mockProducts = {
        createdProducts: [
          {
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

      await controller.createProducts(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
    });
  });
});
