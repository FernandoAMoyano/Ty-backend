import { Request, Response, NextFunction } from 'express';
import { AppError } from '../exceptions/AppError';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error('Error:', error);

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
