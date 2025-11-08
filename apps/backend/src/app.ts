import express from 'express';
import cors from 'cors';
import { setupErrorHandling } from './middleware/error-handler.ts';
import blogRoutes from './routes/blog.ts';

/**
 * Express Application Factory
 * Creates and configures the Express application with all middleware and routes
 * Follows single responsibility principle - this file only handles app setup
 */

export const createApp = (): express.Application => {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(cors());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/blog', blogRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      error: 'Not found',
      status: 404,
    });
  });

  // Error handling middleware (must be last)
  setupErrorHandling(app);

  return app;
};
