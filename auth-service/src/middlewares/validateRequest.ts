import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../errors/appError';

export const validateRequest = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      message: err.msg,
      type: err.type,
    }));

    throw new AppError('Validation failed', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      meta: {
        validationErrors: formattedErrors,
      },
    });
  }

  next();
};
