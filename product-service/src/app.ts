import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import config from './config/validatedConfig.js';
import cors from 'cors';
import bodyParser from 'body-parser';
import { verifyJwt, authorize } from '@thomasdelmas/jwt-middlewares';
import ProductDBRepository from './product/product.db.repository.js';
import ProductCacheRepository from './product/product.cache.repository.js';
import ProductService from './product/product.service.js';
import ProductController from './product/product.controller.js';
import { validateRequest } from './middlewares/validateRequest.js';
import {
  createProductsValidation,
  getProductsValidation,
  getProductValidation,
  validateStockValidation,
} from './product/product.validator.js';
import { models } from './models/init.js';
import CacheClient from './clients/cache.js';
import type { ICacheClient } from './clients/types.js';
import { loadCacheConfig } from './config/loadCacheConfig.js';
import { parseProductFilters } from './middlewares/parseProductFilter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import {
  CreateProductsRequestBody,
  GetProductsWithFilterQuery,
  GetProductWithIdParams,
  ValidateStockRequestBody,
} from './types/request.types.js';
import { swaggerSpec } from './docs/swagger.js';
import swaggerUi from 'swagger-ui-express';
import {
  createProductSuccessData,
  getProductsWithFilterSuccessData,
  getProductWithIdSuccessData,
  ServiceResponse,
  ValidateStockSuccessData,
} from './types/api.types.js';

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
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    /**
     * @openapi
     * /admin/product:
     *   post:
     *     tags:
     *       - Product
     *     summary: Create new products
     *     requestBody:
     *       description: Name, category, price and stock
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/CreateProductsRequest"
     *     responses:
     *       201:
     *         description: Successfuly created Products
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/CreatedProductsResponse"
     *       207:
     *         description: Partial product creation
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/CreatedProductsResponse"
     *       500:
     *         description: No product created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/NoProductCreatedError"
     */
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
        req: express.Request<{}, {}, CreateProductsRequestBody>,
        res: express.Response<ServiceResponse<createProductSuccessData>>,
      ) => this.productController.createProducts(req, res),
    );

    /**
     * @openapi
     * /product/{id}:
     *   get:
     *     tags:
     *       - Product
     *     summary: Search for product with id
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Numeric ID of the user to get
     *     responses:
     *       200:
     *         description: Successfuly Found Products
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/FindProductWithIdResponse"
     *       404:
     *         description: No product found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/NotFoundError"
     */
    this.app.get(
      '/product/:id',
      getProductValidation,
      validateRequest,
      (
        req: express.Request<GetProductWithIdParams, {}, {}>,
        res: express.Response<ServiceResponse<getProductWithIdSuccessData>>,
      ) => this.productController.getProductWithId(req, res),
    );

    /**
     * @openapi
     * /product:
     *   get:
     *     tags:
     *       - Product
     *     summary: Search for product with filter
     *     parameters:
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *         required: false
     *         description: Category names of the filter
     *       - in: query
     *         name: minPrice
     *         schema:
     *           type: number
     *         required: false
     *         description: Minimun price of filter
     *       - in: query
     *         name: maxPrice
     *         schema:
     *           type: number
     *         required: false
     *         description: Maximum price of filter
     *       - in: query
     *         name: searchTerm
     *         schema:
     *           type: string
     *         required: false
     *         description: Product name terms of the filter
     *       - in: query
     *         name: currency
     *         schema:
     *           type: number
     *         required: false
     *         description: Currency of the filter
     *       - in: query
     *         name: page
     *         schema:
     *           type: number
     *         required: false
     *         description: Page number of the filter
     *       - in: query
     *         name: limit
     *         schema:
     *           type: number
     *         required: false
     *         description: Product per page of the filter
     *     responses:
     *       200:
     *         description: Successfuly Found Products
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/FindProductWithFilterResponse"
     *       404:
     *         description: No product found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/NotFoundError"
     */
    this.app.get(
      '/product',
      parseProductFilters,
      getProductsValidation,
      validateRequest,
      (
        req: express.Request<{}, {}, {}, GetProductsWithFilterQuery>,
        res: express.Response<
          ServiceResponse<getProductsWithFilterSuccessData>
        >,
      ) => this.productController.getProductsWithFilter(req, res),
    );

    /**
     * @openapi
     * /validateStock:
     *   post:
     *     tags:
     *       - Product
     *     summary: Products stock validation
     *     requestBody:
     *       description: ID and stock of products
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/ValidateStockRequest"
     *     responses:
     *       200:
     *         description: All products in stock
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/AllProductsInStockResponse"
     *       400:
     *         description: Insufficient Stock for requested products
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/InsufficientStockResponse"
     */
    this.app.post(
      '/validateStock',
      validateStockValidation,
      validateRequest,
      (
        req: express.Request<{}, {}, ValidateStockRequestBody>,
        res: express.Response<ServiceResponse<ValidateStockSuccessData>>,
      ) => this.productController.validateStock(req, res),
    );

    // HealthCheck endpoint
    this.app.get('/', (req: express.Request, res: express.Response) => {
      res.status(200).json({ status: 'ok' });
    });

    this.app.use(errorHandler);
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
