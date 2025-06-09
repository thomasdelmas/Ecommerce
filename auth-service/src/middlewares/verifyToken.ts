import express, { NextFunction } from 'express';
import pkg from 'jsonwebtoken';
const { verify, JsonWebTokenError, TokenExpiredError, NotBeforeError } = pkg;
import config from '../config/validatedConfig.js';

export const verifyToken = (
  req: express.Request<{}, {}, any>,
  res: express.Response,
  next: NextFunction,
): any => {
  const token = req.headers.authorization;

  if (!token) {
    res.status(401).json({ message: 'No JWT' });
    return;
  }

  try {
    const decoded = verify(token, config.privateKey);

    req.body = { ...req.body, payload: decoded };

    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (err instanceof NotBeforeError) {
      return res.status(401).json({ message: 'Token not active' });
    }
    if (err instanceof JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (err instanceof Error) {
      console.log(
        `Unexpected error during JWT verification: ${err.message}`,
        err,
      );
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
