import { Request, Response } from 'express';
import type { IProductController, IProductService } from './product.types';
import {
  CreateProductsRequestBody,
  GetProductsWithFilteredQuery,
  GetProductWithIdParams,
} from '../types/request.types';
import { Errors } from './product.error.js';
import { createProductSuccessData, ServiceResponse } from '../types/api.types';

class ProductController implements IProductController {
  constructor(private productService: IProductService) {}

  async createProducts(
    req: Request<{}, {}, CreateProductsRequestBody>,
    res: Response<ServiceResponse<createProductSuccessData>>,
  ): Promise<any> {
    let returnStatus;

    const { products } = req.body;

    const creationResults = await this.productService.createProducts(products);

    const successCount = creationResults.createdProducts
      ? creationResults.createdProducts.length
      : 0;
    const failCount = creationResults.failed.length;

    if (successCount && failCount) {
      returnStatus = 207;
    } else if (!failCount) {
      returnStatus = 201;
    } else {
      throw Errors.NoProductCreated(creationResults.failed);
    }

    res.status(returnStatus).json({
      success: true,
      data: {
        creationResults: creationResults.createdProducts,
        rejectionResults: creationResults.failed,
      },
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
