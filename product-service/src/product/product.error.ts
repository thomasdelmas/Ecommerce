import { AppError } from '../errors/appError';

export const Errors = {
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
