import { AppError } from '../errors/appError.js';

export const Errors = {
  NoProductCreated: () =>
    new AppError('Failed to create product', {
      statusCode: 400,
      code: 'NO_PRODUCT_CREATED',
    }),

  ProductAlreadyExist: () =>
    new AppError('User already exist', {
      statusCode: 400,
      code: 'USER_ALREADY_REGISTERED',
    }),

  ProductNotFound: () =>
    new AppError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' }),

  Forbidden: () =>
    new AppError('Forbidden operation', { statusCode: 403, code: 'FORBIDDEN' }),
};
