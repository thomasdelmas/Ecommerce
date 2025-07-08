import { AppError } from '../errors/appError';

export const Errors = {
  DeletionFailed: () =>
    new AppError('Failed to delete user', {
      statusCode: 500,
      code: 'FAILED_TO_DELETE',
    }),

  UserAlreadyExist: () =>
    new AppError('User already exist', {
      statusCode: 400,
      code: 'USER_ALREADY_REGISTERED',
    }),

  UserNotFound: () =>
    new AppError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' }),

  InvalidPassword: () =>
    new AppError('Invalid password', {
      statusCode: 401,
      code: 'INVALID_PASSWORD',
    }),

  Forbidden: () =>
    new AppError('Forbidden operation', { statusCode: 403, code: 'FORBIDDEN' }),

  RolePermission: () =>
    new AppError('Failed to retrieve permissions for role', {
      statusCode: 500,
      code: 'ROLE_PERMISSION_ERROR',
    }),

  UserDeletion: (failed: { id: string; reason: string }[]) =>
    new AppError('One or more users could not be deleted', {
      statusCode: 500,
      code: 'USER_DELETION_FAILED',
      meta: { failed },
    }),
};
