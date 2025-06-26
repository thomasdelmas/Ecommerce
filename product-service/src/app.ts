import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import config from './config/validatedConfig.js';
import cors from 'cors';
import bodyParser from 'body-parser';
import { verifyJwt, authorize } from '@thomasdelmas/jwt-middlewares';
import type { ICreateProductsReqBody } from './product/product.types.js';
import ProductRepository from './product/product.repository.js';
import ProductService from './product/product.service.js';
import ProductController from './product/product.controller.js';
import { validateRequest } from './middlewares/validateRequest.js';
import { createProductsValidation } from './product/product.validator.js';
import { models } from './models/init.js';

class App {
  app: express.Application;
  productController: ProductController;
  server: http.Server | null = null;

  constructor(productController?: ProductController) {
    this.app = express();
    this.configureMiddleware();
    const productRepository = new ProductRepository(models.product);
    const productService = new ProductService(productRepository);
    this.productController =
      productController ?? new ProductController(productService);
    this.configureRoutes();
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
      '/product',
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

    // HealthCheck endpoint
    this.app.get('/', (req: express.Request, res: express.Response) => {
      res.status(200).json({ status: 'ok' });
    });
  };

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
      this.server = this.app.listen(config.port, () =>
        console.log(`Server started on port ${config.port}`),
      );

      await this.connectDBWithRetry(config.mongoURI, config.dbName, 3);
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
    await this.disconnectDB();
    if (this.server) {
      this.server.close();
      console.log('Server stopped');
    }
  };
}

export default App;
