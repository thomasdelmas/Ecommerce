import {
  jest,
  describe,
  expect,
  beforeEach,
  it,
  afterEach,
} from '@jest/globals';
import mongoose from 'mongoose';

jest.mock('../config/validatedConfig', () => ({
  mongoURI: 'mongodb://localhost:27017/',
  port: 3000,
  dbName: 'testdb',
  allowedOrigins: '*',
  privateKey: '2oisdfo45oi#$%',
}));

import { App } from '../app';
import config from '../config/validatedConfig';

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

  describe('3rd party connections', () => {
    it('should connect to MongoDB on start', async () => {
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

    it('should retry MongoDB connection before succeeding', async () => {
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

    it('should disconnect on stop MongoDB', async () => {
      const disconnectSpy = jest
        .spyOn(mongoose, 'disconnect')
        .mockResolvedValueOnce();

      appInstance.server = { close: jest.fn() } as any;

      await appInstance.start();
      await appInstance.stop();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should fail after 3 MongoDB connection attempts', async () => {
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
  });
});
