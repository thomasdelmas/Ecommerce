import express from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        message: err.msg,
      })),
    });
    return;
  }
  next();
};
