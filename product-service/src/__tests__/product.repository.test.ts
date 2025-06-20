import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
  afterAll,
  beforeAll,
} from '@jest/globals';
import ProductRepository from '../product/product.repository';
import type { IProduct, IProductModel } from '../product/product.types';
import mongoose, { HydratedDocument } from 'mongoose';
import ProductSchema from '../product/product.schema';
const mockingoose = require('mockingoose');

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
    productModel = mongoose.model('product', ProductSchema);
    repository = new ProductRepository(productModel);

    dbMock = {
      create: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<IProductModel>;
  });

  describe('createProducts', () => {
    it('should call db.create with product data and return result', async () => {
      const products: IProduct[] = [
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
      productModel = mongoose.model('product', ProductSchema);
      repository = new ProductRepository(dbMock);
      const createdProducts = products.map((prod) => ({
        ...prod,
        _id: 'ffffffffffffffffffffffff',
      })) as unknown as HydratedDocument<IProduct>[];
      dbMock.create.mockResolvedValue(createdProducts);

      const result = await repository.createProducts(products);

      expect(dbMock.create).toHaveBeenCalledWith(products);
      expect(result).toBe(createdProducts);
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
