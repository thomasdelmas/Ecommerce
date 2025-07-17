import { Request, Response } from 'express';
import type { IProductController, IProductService } from './product.types';
import {
  CreateProductsRequestBody,
  GetProductsWithFilteredQuery,
  GetProductWithIdParams,
} from '../types/request.types';
import { Errors } from './product.error.js';

class ProductController implements IProductController {
  constructor(private productService: IProductService) {}

  async createProducts(
    req: Request<{}, {}, CreateProductsRequestBody>,
    res: Response,
  ): Promise<any> {
    let returnStatus;
    let returnMessage;

    const { products } = req.body;

    const creationResults = await this.productService.createProducts(products);

    const successCount = creationResults.createdProducts
      ? creationResults.createdProducts.length
      : 0;
    const failCount = creationResults.failed.length;

    if (successCount && failCount) {
      returnStatus = 207;
      returnMessage = 'Succesfuly created some products';
    } else if (!failCount) {
      returnStatus = 201;
      returnMessage = 'Successfuly created products';
    } else {
      throw Errors.NoProductCreated();
    }

    res.status(returnStatus).json({
      creationResults,
      creationCount: successCount,
      rejectionCount: failCount,
      message: returnMessage,
    });
  }

  async getProductWithId(
    req: Request<GetProductWithIdParams, {}, {}>,
    res: Response,
  ): Promise<any> {
    const productId = req.params.id;
    const product = await this.productService.getProductWithId(productId);

    if (!product) {
      throw Errors.ProductNotFound();
    }

    res.status(200).json({
      product,
      message: 'Found product id ' + productId,
    });
  }

  async getProductsWithFilter(
    req: Request<{}, {}, {}, GetProductsWithFilteredQuery>,
    res: Response,
  ): Promise<any> {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const filter = req.filteredQuery || {};

    const filteredProducts = await this.productService.getProductsWithFilter(
      filter,
      page,
      limit,
    );

    const returnCount = filteredProducts.length;
    if (returnCount < 1) {
      throw Errors.ProductNotFound();
    }

    res.status(200).json({
      products: filteredProducts,
      count: returnCount,
      message: 'Successfuly found products',
    });
  }
}

export default ProductController;
