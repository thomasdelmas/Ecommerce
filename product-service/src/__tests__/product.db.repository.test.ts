import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterAll,
  beforeAll,
} from '@jest/globals';
import ProductRepository from '../product/product.db.repository';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import ProductSchema, { IProductSchema } from '../product/product.schema';
import { IProductModel } from '../types/db.types';
const mockingoose = (await import('mockingoose')).default;

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let dbMock: jest.Mocked<IProductModel>;
  let productModel: IProductModel;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    dbMock = {
      create: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<IProductModel>;

    repository = new ProductRepository(dbMock);
  });

  describe('createProducts', () => {
    it('should call db.create with product data and return result', async () => {
      const products = [
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
          name: 'T-shirt green',
          category: 'T-shirt',
          price: 34.0,
          currency: 'euro',
          stock: 10,
        },
      ];
      const expectedProducts = [
        {
          id: '6862b2c2f4b88483321b9fdb',
          createdAt: Date.now(),
          name: 'T-shirt blue',
          category: 'T-shirt',
          price: 33.5,
          currency: 'euro',
          stock: 5,
        },
        {
          id: '6862b2c2f4b88483321b9fda',
          createdAt: Date.now(),
          name: 'T-shirt green',
          category: 'T-shirt',
          price: 34.0,
          currency: 'euro',
          stock: 10,
        },
      ];

      const createdProducts = [
        {
          _id: new Types.ObjectId('6862b2c2f4b88483321b9fdb'),
          ...products[0],
          toObject: jest.fn().mockReturnValue(products[0]),
        },
        {
          _id: new Types.ObjectId('6862b2c2f4b88483321b9fda'),
          ...products[1],
          toObject: jest.fn().mockReturnValue(products[1]),
        },
      ] as unknown as HydratedDocument<IProductSchema>[];

      dbMock.create.mockResolvedValue(createdProducts);

      const result = await repository.createProducts(products);

      expect(dbMock.create).toHaveBeenCalledWith(products);
      expect(result).toStrictEqual(expectedProducts);
    });

    it('should propagate errors if db.create throws', async () => {
      productModel = mongoose.model('product', ProductSchema);
      repository = new ProductRepository(dbMock);
      dbMock.create.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(
        repository.createProducts([
          {
            createdAt: Date.now(),
            name: 'T-shirt blue',
            category: 'T-shirt',
            price: 33.5,
            currency: 'euro',
            stock: 5,
          },
        ]),
      ).rejects.toThrow('DB error');
    });
  });

  describe('getProductByName', () => {
    it('should call db.findOne with name filter and return product', async () => {
      const productDoc = {
        createdAt: Date.now(),
        name: 'T-shirt blue',
        category: 'T-shirt',
        price: 33.5,
        currency: 'euro',
        stock: 5,
      };
      productModel = mongoose.model('product', ProductSchema);
      repository = new ProductRepository(productModel);
      mockingoose(productModel).toReturn(productDoc, 'findOne');

      const res = await repository.getProductByName(productDoc.name);

      expect(res).toMatchObject(productDoc);

      mockingoose(productModel).reset('findOne');
    });

    it('should return null if db.findOne returns null', async () => {
      const name = 'nonexistent';

      productModel = mongoose.model('product', ProductSchema);
      repository = new ProductRepository(productModel);
      mockingoose(productModel).toReturn(null, 'findOne');

      const res = await repository.getProductByName(name);

      expect(res).toBe(null);

      mockingoose(productModel).reset('findOne');
    });

    it('should propagate errors if db.findOne rejects', async () => {
      productModel = mongoose.model('product', ProductSchema);
      repository = new ProductRepository(dbMock);
      const name = 'errorproduct';
      dbMock.findOne.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(repository.getProductByName(name)).rejects.toThrow(
        'DB error',
      );
    });
  });
});
