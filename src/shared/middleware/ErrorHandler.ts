import { Request, Response, NextFunction } from 'express';
import { AppError } from '../exceptions/AppError';
import { logger } from '../logger/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(error.message, {
    stack: error.stack,
    method: req.method,
    path: req.originalUrl,
    ...(error instanceof AppError && { statusCode: error.statusCode, code: error.code }),
  });

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
    return;
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      originalMessage: error.message,
      stack: error.stack,
    }),
  });
};
