import { Request, Response, NextFunction } from 'express';

/**
 * 404 Not Found middleware
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl
  });
};

/**
 * Error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Determine status code
  let statusCode = 500;
  if (res.statusCode && res.statusCode !== 200) {
    statusCode = res.statusCode;
  }

  res.status(statusCode).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};