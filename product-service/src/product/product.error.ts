import { AppError } from '../errors/appError.js';
import { CreateProductsPayload, StockValidationObj } from './product.types.js';

export const Errors = {
  NoProductCreated: (
    failed: { input: CreateProductsPayload; reason: string }[],
  ) =>
    new AppError('Failed to create product', {
      statusCode: 500,
      code: 'PRODUCT_CREATION_FAILED',
      meta: { failed },
    }),

  ProductAlreadyExist: () =>
    new AppError('Product already exist', {
      statusCode: 400,
      code: 'PRODUCT_ALREADY_REGISTERED',
    }),

  ProductNotFound: () =>
    new AppError('Product not found', {
      statusCode: 404,
      code: 'PRODUCT_NOT_FOUND',
    }),

  ProductsNotValidated: (
    failed: { requestedProduct: StockValidationObj; reason: string }[],
  ) =>
    new AppError('Failed to validate products', {
      statusCode: 400,
      code: 'PRODUCTS_VALIDATION_FAILED',
      meta: { failed },
    }),

  Forbidden: () =>
    new AppError('Forbidden operation', { statusCode: 403, code: 'FORBIDDEN' }),
};
