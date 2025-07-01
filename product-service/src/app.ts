import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import config from './config/validatedConfig.js';
import cors from 'cors';
import bodyParser from 'body-parser';
import { verifyJwt, authorize } from '@thomasdelmas/jwt-middlewares';
import type {
  ICreateProductsReqBody,
  IGetProductsWithFilterQuery,
  IGetProductWithIdParams,
} from './product/product.types.js';
import ProductDBRepository from './product/product.db.repository.js';
import ProductCacheRepository from './product/product.cache.repository.js';
import ProductService from './product/product.service.js';
import ProductController from './product/product.controller.js';
import { validateRequest } from './middlewares/validateRequest.js';
import {
  createProductsValidation,
  getProductsValidation,
  getProductValidation,
} from './product/product.validator.js';
import { models } from './models/init.js';
import CacheClient from './clients/cache.js';
import type { ICacheClient } from './clients/types.js';
import { loadCacheConfig } from './config/loadCacheConfig.js';
import { parseProductFilters } from './middlewares/parseProductFilter.js';

class App {
  app: express.Application;
  private _productController: ProductController | null = null;
  server: http.Server | null = null;
  private _cacheClient: ICacheClient | null = null;

  constructor() {
    this.app = express();
    this.configureMiddleware();
  }

  configureMiddleware = () => {
    if (!config.allowedOrigins) {
      console.warn('No allowed cross-origin configured');
    }
    this.app.use(bodyParser.json());
    this.app.use(cors({ origin: config.allowedOrigins }));
  };

  configureRoutes = () => {
    this.app.post(
      '/admin/product',
      createProductsValidation,
      validateRequest,
      verifyJwt({
        secretOrPublicKey: config.privateKey,
      }),
      authorize({
        requiredPermissions: ['write:product'],
      }),
      (
        req: express.Request<{}, {}, ICreateProductsReqBody>,
        res: express.Response,
      ) => this.productController.createProducts(req, res),
    );

    this.app.get(
      '/product/:id',
      getProductValidation,
      validateRequest,
      (
        req: express.Request<IGetProductWithIdParams, {}, {}>,
        res: express.Response,
      ) => this.productController.getProductWithId(req, res),
    );

    this.app.get(
      '/product',
      parseProductFilters,
      getProductsValidation,
      validateRequest,
      (
        req: express.Request<{}, {}, {}, IGetProductsWithFilterQuery>,
        res: express.Response,
      ) => this.productController.getProductsWithFilter(req, res),
    );

    // HealthCheck endpoint
    this.app.get('/', (req: express.Request, res: express.Response) => {
      res.status(200).json({ status: 'ok' });
    });
  };

  get productController() {
    if (!this._productController) throw new Error('Controller not initialized');
    return this._productController;
  }

  get cacheClient() {
    if (!this._cacheClient) throw new Error('Cache client not initialized');
    return this._cacheClient;
  }

  connectDBWithRetry = async (
    uri: string,
    dbName: string,
    count: number,
  ): Promise<void> => {
    try {
      await mongoose.connect(uri, {
        dbName: dbName,
        serverSelectionTimeoutMS: 5000,
      });

      console.log('Connected to MongoDB');
    } catch (e) {
      if (e instanceof Error) {
        console.log(`Error connecting to MongoDB: ${e.message}`);
      }

      if (count - 1 > 0) {
        console.log('Retrying in 3 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 3000));

        await this.connectDBWithRetry(uri, dbName, count - 1);
      } else {
        throw new Error('Failed to connect to MongoDB.');
      }
    }
  };

  start = async () => {
    try {
      const cacheConfig = loadCacheConfig();
      this._cacheClient = new CacheClient(cacheConfig);
      const cacheConnection = this.cacheClient.get();
      cacheConnection.on('error', async (err) => {
        console.error('Critical cache error:', err);
        await this.stop();
      });
      const productDBRepository = new ProductDBRepository(models.product);
      const productCacheRepository = new ProductCacheRepository(
        cacheConnection,
      );
      const productService = new ProductService(
        productDBRepository,
        productCacheRepository,
      );
      this._productController = new ProductController(productService);
      this.configureRoutes();

      this.server = this.app.listen(config.port, () =>
        console.log(`Server started on port ${config.port}`),
      );

      await this.connectDBWithRetry(config.mongoURI, config.dbName, 3);
      await this.cacheClient.connect();
    } catch (e) {
      if (e instanceof Error) {
        console.log(e.message);
      }
      await this.stop();
    }
  };

  disconnectDB = async () => {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  };

  stop = async () => {
    if (this._cacheClient) {
      this._cacheClient.destroy();
    }
    await this.disconnectDB();
    if (this.server) {
      this.server.close();
      console.log('Server stopped');
    }
  };
}

export default App;
