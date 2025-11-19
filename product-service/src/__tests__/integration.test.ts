import {
  describe,
  expect,
  beforeAll,
  it,
  afterAll,
  afterEach,
  jest,
} from '@jest/globals';
import request from 'supertest';
import App from '../app';
import config from '../config/validatedConfig';
import jwt from 'jsonwebtoken';
import { models } from '../models/init';
import { Types } from 'mongoose';
import CacheClient from '../clients/cache';
import { loadCacheConfig } from '../config/loadCacheConfig';
import ProductDBRepository from '../product/product.db.repository';
const { sign } = jwt;

describe('ProductService - Integration tests', () => {
  let appInstance: App;
  let products: any;
  let adminJwt: string;

  afterEach(async () => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    appInstance = new App();
    await appInstance.start();

    adminJwt = sign(
      {
        id: 'ffffffffffffffffffffffff',
        permissions: [
          'read:user',
          'write:user',
          'delete:user',
          'write:product',
          'read:product',
          'delete:product',
        ],
      },
      config.privateKey,
      { expiresIn: '15min' },
    );

    products = [
      {
        createdAt: Date.now(),
        name: 'Purple Pant',
        category: 'Pant',
        price: 100,
        currency: 'euro',
        stock: 30,
      },
      {
        createdAt: Date.now(),
        name: 'Black Pant',
        category: 'Pant',
        price: 200,
        currency: 'Dollar',
        stock: 3000,
      },
      {
        createdAt: Date.now(),
        name: 'Blue Pant',
        category: 'Pant',
        price: 10,
        currency: 'euro',
        stock: 3,
      },
      {
        createdAt: Date.now(),
        name: 'Green socks',
        category: 'Socks',
        price: 1,
        currency: 'euro',
        stock: 20000,
      },
      {
        createdAt: Date.now(),
        name: 'Red beany',
        category: 'Beany',
        price: 1000,
        currency: 'euro',
        stock: 300,
      },
    ];

    try {
      await models.product.create(products);
    } catch (err) {
      if (err instanceof Error) {
        console.warn(
          'Mongoose failed to connect skip product creation:',
          err.message,
        );
      }
    }
  });

  afterAll(async () => {
    try {
      const cacheConfig = loadCacheConfig();
      const cacheClient = new CacheClient(cacheConfig);
      await cacheClient.connect();
      const cache = cacheClient.get();
      await cache.flushAll();
      cache.destroy();
    } catch (err) {
      if (err instanceof Error) {
        console.warn(
          'Redis cleanup skipped (Redis not available):',
          err.message,
        );
      }
    }

    try {
      await models.product.deleteMany();
    } catch (err) {
      if (err instanceof Error) {
        console.warn('Mongoose failed to connect skip deletion:', err.message);
      }
    }

    await appInstance.stop();
  });

  describe('createProducts endpoint', () => {
    const productToCreate = [
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
    ];
    const req = { products: productToCreate };

    it('should create requested products successfully', async () => {
      const res = await request(appInstance.app)
        .post('/admin/product')
        .set({ Authorization: adminJwt })
        .send(req);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        success: true,
        data: {
          creationResults: productToCreate,
          rejectionResults: [],
        },
      });
      await models.product.deleteMany({ category: 'T-shirt' });
    });

    it('should reject creation without JWT', async () => {
      const res = await request(appInstance.app)
        .post('/admin/product')
        .send(req);

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('No JWT provided');
    });

    it('should reject creation without proper permission', async () => {
      const userJwt = sign(
        { id: 'user123', permissions: ['read:product'] },
        config.privateKey,
        { expiresIn: '15min' },
      );

      const res = await request(appInstance.app)
        .post('/admin/product')
        .set({ Authorization: userJwt })
        .send(req);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toBe('Forbidden');
    });

    it('should reject some duplicate inputs products and create valid ones', async () => {
      const res = await request(appInstance.app)
        .post('/admin/product')
        .set({ Authorization: adminJwt })
        .send({
          products: [
            {
              name: 'Duplicate Product',
              category: 'Test',
              price: 10,
              stock: 5,
            },
            {
              name: 'Duplicate Product',
              category: 'FalseCategory',
              price: 109,
              stock: 50,
            },
            { name: 'Valid Product', category: 'Test', price: 10, stock: 5 },
          ],
        });

      expect(res.status).toBe(207);
      expect(res.body.data.creationResults.length).toBe(2);
      expect(res.body.data.rejectionResults.length).toBe(1);
    });

    it('should reject the valid product already in DB and create another valid one', async () => {
      const res = await request(appInstance.app)
        .post('/admin/product')
        .set({ Authorization: adminJwt })
        .send({
          products: [
            { name: 'Valid Product', category: 'Test', price: 10, stock: 5 },
            {
              name: 'Another Valid Product',
              category: 'Test',
              price: 10,
              stock: 5,
            },
          ],
        });

      expect(res.status).toBe(207);
      expect(res.body.data.creationResults.length).toBe(1);
      expect(res.body.data.rejectionResults.length).toBe(1);
    });
  });

  describe('getProductWithId endpoint', () => {
    it('should retrieve product information succesfuly', async () => {
      const productId = new Types.ObjectId().toHexString();

      const newProduct = {
        _id: productId,
        createdAt: Date.now(),
        name: 'Purple Pant',
        category: 'Pant',
        price: 100,
        currency: 'euro',
        stock: 30,
      };
      const expectedProduct = {
        name: 'Purple Pant',
        category: 'Pant',
        price: 100,
        currency: 'euro',
        stock: 30,
      };

      await models.product.create(newProduct);

      const res = await request(appInstance.app)
        .get('/product/' + productId)
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        data: { product: expectedProduct },
      });

      await models.product.deleteMany({ _id: productId });
    });

    it('should return 404 for non-existent product ID', async () => {
      const nonExistingId = new Types.ObjectId().toHexString();

      const res = await request(appInstance.app).get(
        '/product/' + nonExistingId,
      );

      expect(res.status).toBe(404);
      expect(res.body.error.message).toContain('Product not found');
    });

    it('should return 400 for invalid product ID', async () => {
      const res = await request(appInstance.app).get('/product/not-an-id');
      expect(res.status).toBe(400);
    });
  });

  describe('getProductWithFilter endpoint', () => {
    it('should retrieve filtered products information succesfuly without cache hit', async () => {
      const filter = '?page=1&limit=20&minPrice=20&maxPrice=200&category=Pant';

      const getProductsWithFilterSpy = jest.spyOn(
        ProductDBRepository.prototype,
        'getProductsWithFilter',
      );

      const res = await request(appInstance.app)
        .get('/product' + filter)
        .send();

      expect(getProductsWithFilterSpy).toHaveBeenCalled();

      expect(res.status).toBe(200);
      expect(res.body.data.products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Purple Pant',
            category: 'Pant',
            price: 100,
            currency: 'euro',
            stock: 30,
          }),
          expect.objectContaining({
            name: 'Black Pant',
            category: 'Pant',
            price: 200,
            currency: 'Dollar',
            stock: 3000,
          }),
        ]),
      );

      expect(res.body.data.products.length).toBe(2);
    });

    it('should retrieve filtered products information succesfuly with cache hit (same request than the previous)', async () => {
      const filter = '?page=1&limit=20&minPrice=20&maxPrice=200&category=Pant';

      const getProductsWithFilterSpy = jest.spyOn(
        ProductDBRepository.prototype,
        'getProductsWithFilter',
      );

      const res = await request(appInstance.app)
        .get('/product' + filter)
        .send();

      expect(getProductsWithFilterSpy).not.toHaveBeenCalled();

      expect(res.status).toBe(200);
      expect(res.body.data.products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Purple Pant',
            category: 'Pant',
            price: 100,
            currency: 'euro',
            stock: 30,
          }),
          expect.objectContaining({
            name: 'Black Pant',
            category: 'Pant',
            price: 200,
            currency: 'Dollar',
            stock: 3000,
          }),
        ]),
      );

      expect(res.body.data.products.length).toBe(2);
    });

    it('should return products matching searchTerm', async () => {
      const res = await request(appInstance.app)
        .get('/product?searchTerm=Pant')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.products.length).toBeGreaterThan(0);
      res.body.data.products.forEach((p: any) =>
        expect(p.name.toLowerCase()).toContain('pant'),
      );
    });

    it('should return paginated products', async () => {
      const res = await request(appInstance.app)
        .get('/product?page=1&limit=2')
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.products.length).toBeLessThanOrEqual(2);
    });

    it('should hit the cache after first request', async () => {
      const filter = '?category=Pant';
      const spy = jest.spyOn(
        ProductDBRepository.prototype,
        'getProductsWithFilter',
      );

      await request(appInstance.app)
        .get('/product' + filter)
        .send();
      await request(appInstance.app)
        .get('/product' + filter)
        .send();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for invalid filters', async () => {
      const res = await request(appInstance.app)
        .get('/product?minPrice=badValue')
        .send();

      expect(res.status).toBe(400);
    });
  });

  describe('validateStock endpoint', () => {
    it('should retrieve product stock succesfuly', async () => {
      const productId = new Types.ObjectId().toHexString();

      const newProducts = [
        {
          _id: productId,
          createdAt: Date.now(),
          name: 'Purple Pant',
          category: 'Pant',
          price: 100,
          currency: 'euro',
          stock: 30,
        },
      ];
      const requestedProduct = [
        {
          productId,
          stock: 8,
        },
      ];
      const expectedProducts = [
        {
          name: 'Purple Pant',
          category: 'Pant',
          price: 100,
          currency: 'euro',
          stock: 8,
        },
      ];
      const req = { products: requestedProduct };

      await models.product.create(newProducts);

      const res = await request(appInstance.app)
        .post('/validateStock')
        .send(req);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        data: { validatedProducts: expectedProducts, unvalidatedProducts: [] },
      });

      await models.product.deleteMany({ _id: productId });
    });

    it('should partialy retrieve product stock succesfuly and errors', async () => {
      const productId1 = new Types.ObjectId().toHexString();
      const productId2 = new Types.ObjectId().toHexString();

      const newProducts = [
        {
          _id: productId1,
          createdAt: Date.now(),
          name: 'Purple Pant',
          category: 'Pant',
          price: 100,
          currency: 'euro',
          stock: 100,
        },
        {
          _id: productId2,
          createdAt: Date.now(),
          name: 'White Pant',
          category: 'Pant',
          price: 10,
          currency: 'euro',
          stock: 5,
        },
      ];
      const requestedProduct = [
        {
          productId: productId1,
          stock: 50,
        },
        {
          productId: productId2,
          stock: 20,
        },
      ];
      const expectedValidatedProducts = [
        {
          name: 'Purple Pant',
          category: 'Pant',
          price: 100,
          currency: 'euro',
          stock: 50,
        },
      ];
      const expectedUnvalidatedProducts = [
        {
          requestedProduct: {
            productId: productId2,
            stock: 20,
          },
          reason: 'INSUFFICIENT_STOCK',
        },
      ];
      const req = { products: requestedProduct };

      await models.product.create(newProducts);

      const res = await request(appInstance.app)
        .post('/validateStock')
        .send(req);

      expect(res.status).toBe(207);
      expect(res.body).toMatchObject({
        success: true,
        data: {
          validatedProducts: expectedValidatedProducts,
          unvalidatedProducts: expectedUnvalidatedProducts,
        },
      });

      await models.product.deleteMany({ _id: [productId1, productId2] });
    });

    it('should fail to retrieve product stock for "INSUFFICIENT_STOCK" and skip dupplicate product id request', async () => {
      const productId1 = new Types.ObjectId().toHexString();

      const newProducts = [
        {
          _id: productId1,
          createdAt: Date.now(),
          name: 'Purple Pant',
          category: 'Pant',
          price: 100,
          currency: 'euro',
          stock: 200,
        },
      ];
      const requestedProduct = [
        {
          productId: productId1,
          stock: 250,
        },
        {
          productId: productId1,
          stock: 50,
        },
      ];

      const expectedUnvalidatedProducts = [
        {
          requestedProduct: {
            productId: productId1,
            stock: 250,
          },
          reason: 'INSUFFICIENT_STOCK',
        },
      ];
      const req = { products: requestedProduct };

      await models.product.create(newProducts);

      const res = await request(appInstance.app)
        .post('/validateStock')
        .send(req);

      console.log(res.body);

      expect(res.status).toBe(400);
      expect(res.body.error.meta.failed).toMatchObject({
        ...expectedUnvalidatedProducts,
      });

      await models.product.deleteMany({ _id: [productId1] });
    });
  });
});
