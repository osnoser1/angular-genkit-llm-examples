import type { Express, Request, Response, NextFunction } from 'express';

/**
 * Error Handler Middleware
 * Handles all errors in the application and sends appropriate responses
 */

export class APIError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

export const errorHandler = (
  err: Error | APIError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error('Error:', err);

  if (err instanceof APIError) {
    res.status(err.statusCode).json({
      error: err.message,
      status: err.statusCode,
    });
    return;
  }

  // Handle validation or other errors
  const message = err.message || 'Internal server error';
  const statusCode = 500;

  res.status(statusCode).json({
    error: message,
    status: statusCode,
  });
};

/**
 * Registers error handler middleware with Express app
 */
export const setupErrorHandling = (app: Express): void => {
  app.use(errorHandler);
};
