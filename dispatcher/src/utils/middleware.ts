import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to inject services into route handlers
 * This provides access to jobDispatchService and providerManager
 */
export const injectServices = (req: Request & { app: any }, res: Response, next: NextFunction) => {
  // Services are stored in app by the main initialization
  const jobDispatchService = req.app.get('jobDispatchService');
  const providerManager = req.app.get('providerManager');
  
  // Attach to request for easy access
  (req as any).jobDispatchService = jobDispatchService;
  (req as any).providerManager = providerManager;
  
  next();
};

/**
 * 404 Not Found middleware
 */
export const notFound = (req: Request, res: Response, _next: NextFunction) => {
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
  _next: NextFunction
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