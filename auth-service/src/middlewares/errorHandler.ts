import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/appError';
import {
  AuthorizationError,
  VerifyJwtError,
} from '@thomasdelmas/jwt-middlewares';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err);

  if (err instanceof AuthorizationError || err instanceof VerifyJwtError) {
    const appErr = new AppError(err.message, {
      code: err.code,
      statusCode: err.statusCode,
      meta: err.meta,
    });
    res.status(appErr.statusCode).json({
      success: false,
      error: {
        message: appErr.message,
        code: appErr.code,
        ...(appErr.meta && { meta: appErr.meta }),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        ...(err.meta && { meta: err.meta }),
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      message: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    },
  });
}
