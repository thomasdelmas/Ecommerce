import {
  jest,
  describe,
  expect,
  beforeEach,
  it,
  afterEach,
} from '@jest/globals';
import mongoose from 'mongoose';

import App from '../app';
import config from '../config/validatedConfig';

import CacheClient from '../clients/cache';

const mockConnect = jest
  .spyOn(CacheClient.prototype, 'connect')
  .mockImplementation(async () => {
    console.log('mocked connect function');
  });
const mockDestroy = jest
  .spyOn(CacheClient.prototype, 'destroy')
  .mockImplementation(async () => {
    console.log('mocked destroy function');
  });

jest.mock('../clients/cache', () => {
  return jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    destroy: mockDestroy,
  }))
});

jest.mock('../product/product.controller', () => {
  return {
    ProductController: jest.fn().mockImplementation(() => ({
      createProducts: jest.fn((req: any, res: any) =>
        res.status(201).send({ ok: true }),
      ),
    })),
  };
});

jest.mock('../models/init', () => ({
  models: {
    product: {},
  },
}));

jest.mock('../config/validatedConfig', () => ({
  mongoURI: 'mongodb://localhost:27017/',
  port: 3000,
  dbName: 'ProductDB',
  allowedOrigins: '*',
  privateKey: '2oisdfo45oi#$%',
}));

const originalConfig = { ...config };

describe('App', () => {
  let appInstance: App;

  beforeEach(async () => {
    Object.assign(config, originalConfig);
    appInstance = new App();
  });

  afterEach(async () => {
    if (appInstance?.stop) {
      await appInstance.stop();
    }
		jest.clearAllMocks()
  });

  // describe('Middleware & Routes', () => {
    // it('should respond to health check route', async () => {
    //   const res = await request(appInstance.app).get('/');
    //   expect(res.status).toBe(200);
    //   expect(res.body).toEqual({ status: 'ok' });
    // });

    //   it('should call createProducts controller on POST /product', async () => {
    //     const createProductsMock = jest.fn((_req: any, res: any) =>
    //       res.status(201).send(),
    //     );

    //     const mockController = new ProductController({} as any);
    // 		mockController.createProducts = createProductsMock;

    //     const appInstance2 = new App(mockController);

    // 		const res = await request(appInstance2.app).post('/product').set({ Authorization: "dfds" }).send({
    // 			"products": [
    // 				{
    // 					"name": "T-shirt blue",
    // 					"category": "T-shirt",
    // 					"price": "33.50",
    // 					"currency": "euro",
    // 					"stock": "5"
    // 				},
    // 				{
    // 					"name": "T-shirt vert",
    // 					"category": "T-shirt",
    // 					"price": "36.50",
    // 					"currency": "euro",
    // 					"stock": "10"
    // 				}
    // 			]
    // 		});
    // 		console.log(res);
    //     expect(res.status).toBe(201);
    //     expect(createProductsMock).toHaveBeenCalled();
    //   });
  // });

  describe('3rd party connections', () => {
    it('should connect to MongoDB and Redis on start', async () => {
      const connectSpy = jest
        .spyOn(mongoose, 'connect')
        .mockResolvedValueOnce({} as any);
      const listenSpy = jest
        .spyOn(appInstance.app, 'listen')
        .mockImplementation((_port: any, cb: any) => {
          if (cb) cb();
          return { close: jest.fn() } as any;
        });

      await appInstance.start();

      expect(connectSpy).toHaveBeenCalledTimes(1);
			expect(mockConnect).toHaveBeenCalled();
      expect(listenSpy).toHaveBeenCalled();
    });
		
    it('should retry MongoDB connection before succeeding and still connect to Redis', async () => {
      const connectSpy = jest
        .spyOn(mongoose, 'connect')
        .mockRejectedValueOnce(new Error('fail1'))
        .mockResolvedValueOnce({} as any);

      const listenSpy = jest
        .spyOn(appInstance.app, 'listen')
        .mockImplementation((_port: any, cb: any) => {
          if (cb) cb();
          return { close: jest.fn() } as any;
        });

      await appInstance.start();

      expect(connectSpy).toHaveBeenCalledTimes(2);
			expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(listenSpy).toHaveBeenCalled();
    });

		it('should destroy Redis client on stop and disconnect MongoDB', async () => {
			const disconnectSpy = jest
				.spyOn(mongoose, 'disconnect')
				.mockResolvedValueOnce();

			appInstance.server = { close: jest.fn() } as any;

			await appInstance.stop();

			expect(mockDestroy).toHaveBeenCalled();
			expect(disconnectSpy).toHaveBeenCalled();
		});

    it('should fail after 3 MongoDB connection attempts and still destroy Redis', async () => {
      const error = new Error('Mongo fail');
      const connectSpy = jest
        .spyOn(mongoose, 'connect')
        .mockRejectedValue(error);

      const disconnectSpy = jest
        .spyOn(mongoose, 'disconnect')
        .mockResolvedValueOnce();

      const stopSpy = jest.spyOn(appInstance, 'stop');

      await appInstance.start();

      expect(connectSpy).toHaveBeenCalledTimes(3);
			expect(mockConnect).not.toHaveBeenCalled();
			expect(mockDestroy).toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalled();
      expect(stopSpy).toHaveBeenCalled();
    }, 20000);
  });

  describe('Server Lifecycle', () => {
    it('should start the server', async () => {
      const connectSpy = jest
        .spyOn(mongoose, 'connect')
        .mockResolvedValueOnce({} as any);
      const listenSpy = jest
        .spyOn(appInstance.app, 'listen')
        .mockImplementation((_port: any, cb: any) => {
          if (cb) cb();
          return { close: jest.fn() } as any;
        });

      await appInstance.start();

      expect(listenSpy).toHaveBeenCalled();
      expect(connectSpy).toHaveBeenCalled();
			expect(mockConnect).toHaveBeenCalled();
    });

    it('should stop the server and disconnect DB', async () => {
      const closeMock = jest.fn();
      const disconnectSpy = jest
        .spyOn(mongoose, 'disconnect')
        .mockResolvedValueOnce();

      appInstance.server = { close: closeMock } as any;

      await appInstance.stop();

      expect(closeMock).toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalled();
			expect(mockDestroy).toHaveBeenCalled();
    });
  });
});
