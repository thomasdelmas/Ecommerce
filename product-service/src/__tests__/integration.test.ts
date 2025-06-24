import { describe, expect, beforeAll, it, afterAll } from '@jest/globals';
import request from 'supertest';
import App from '../app';
import config from '../config/validatedConfig';
import jwt from 'jsonwebtoken';
const { sign } = jwt;

describe('AuthService - Integration tests', () => {
  let appInstance: App;
  let products: any;
  let adminJwt: string;

  beforeAll(async () => {
    appInstance = new App();
    await appInstance.start();

    products = [
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
  });

  afterAll(async () => {
    await appInstance.stop();
  });

  describe('createProducts endpoint', () => {
    it('should create requested products successfully', async () => {
      const req = { products };

      const res = await request(appInstance.app)
        .post('/product')
        .set({ Authorization: adminJwt })
        .send(req);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        creationResults: {
          createdProducts: products,
          failed: [],
        },
        creationCount: 2,
        rejectionCount: 0,
        message: 'Successfuly created products',
      });
    });
  });
});
