import {
  jest,
  describe,
  expect,
  beforeEach,
  it,
  afterEach,
} from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

//  Mock first
jest.mock('../controllers/userController', () => {
  return {
    UserController: jest.fn().mockImplementation(() => ({
      register: jest.fn((req: any, res: any) =>
        res.status(201).send({ ok: true }),
      ),
    })),
  };
});

jest.mock('../models/init', () => ({
  models: {
    user: {},
  },
}));

jest.mock('../config', () => ({
  config: {
    mongoURI: 'mongodb://localhost:27017/test',
    port: 3000,
    dbName: 'testdb',
    allowedOrigins: '*',
  },
}));

import { App } from '../app';
import { config } from '../config';

const originalConfig = { ...config };

describe('App', () => {
  let appInstance: App;

  beforeEach(() => {
    Object.assign(config, originalConfig);
    appInstance = new App();
  });

  afterEach(async () => {
    if (appInstance?.stop) {
      await appInstance.stop();
    }
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('App config vars', () => {
    let app: App;

    beforeEach(() => {
      jest.clearAllMocks();
      app = new App();
    });

    it('should call console.warn if allowedOrigins is undefined', async () => {
      config.allowedOrigins = undefined as any;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const appInstance = new App();
      await appInstance.start();

      expect(warnSpy).toHaveBeenCalledWith(
        'No allowed cross-origin configured',
      );
      await appInstance.stop();
    });

    it('should throw if mongoURI is undefined', async () => {
      config.mongoURI = undefined as any;
      const stopSpy = jest
        .spyOn(app, 'stop')
        .mockImplementation(async () => {});
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await app.start();

      expect(logSpy).toHaveBeenCalledWith('MongoDB URI is undefined');
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should throw if port is undefined', async () => {
      config.mongoURI = 'mongodb://localhost:27017/test';
      config.port = undefined as any;
      const stopSpy = jest
        .spyOn(app, 'stop')
        .mockImplementation(async () => {});
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await app.start();

      expect(logSpy).toHaveBeenCalledWith('Port is undefined');
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should throw if dbName is undefined', async () => {
      config.mongoURI = 'mongodb://localhost:27017/test';
      config.port = 3000;
      config.dbName = undefined as any;
      const stopSpy = jest
        .spyOn(app, 'stop')
        .mockImplementation(async () => {});
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await app.start();

      expect(logSpy).toHaveBeenCalledWith('DB Name is undefined');
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('Middleware & Routes', () => {
    it('should respond to health check route', async () => {
      const res = await request(appInstance.app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });

    it('should call register controller on POST /register', async () => {
      const registerMock = jest.fn((_req: any, res: any) =>
        res.status(201).send(),
      );

      const mockController = { register: registerMock } as any;

      const appInstance = new App(mockController);

      const res = await request(appInstance.app).post('/register').send({
        username: 'test@example.com',
        password: '123456D',
        confirmPassword: '123456D',
      });

      expect(res.status).toBe(201);
      expect(registerMock).toHaveBeenCalled();
    });
  });

  describe('Database Connection', () => {
    it('should connect to MongoDB immediately', async () => {
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
      expect(listenSpy).toHaveBeenCalled();
    });

    it('should retry on MongoDB connection failure', async () => {
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
      expect(listenSpy).toHaveBeenCalled();
    });

    it('should fail after all retries', async () => {
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
    });
  });
});
