import { createApp } from './app.ts';
import { config } from './config/env.ts';

/**
 * Application Entry Point
 * Initializes the server and starts listening on the configured port
 */

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`🚀 Server is running on port ${config.port}`);
  console.log(`📝 API Endpoints:`);
  console.log(`  - POST /api/blog/subtopics (streaming)`);
  console.log(`    Generates subtopics for a given topic`);
  console.log(`    Request body: { topic: string }`);
  console.log('');
  console.log(`  - POST /api/blog/post-summaries (streaming)`);
  console.log(`    Generates blog post summaries for a topic and subtopic`);
  console.log(`    Request body: { topic: string, subtopic: string, description: string }`);
  console.log('');
  console.log(`  - POST /api/blog/post (streaming)`);
  console.log(`    Generates a complete blog post with all details`);
  console.log(`    Request body: { topic: string, subtopic: string, summary: string, readingTime: number }`);
  console.log('');
  console.log(`  - POST /api/blog/analyze-blog-post (legacy, streaming)`);
  console.log(`    Analyzes and generates blog posts for a topic`);
  console.log(`    Request body: { topic: string, audience?: string }`);
  console.log('');
  console.log(`  - POST /api/blog/structured-output (legacy, non-streaming)`);
  console.log(`    Generates structured blog post output for a topic`);
  console.log(`    Request body: { topic: string, audience?: string }`);
  console.log('');
  console.log(`  - GET /health`);
  console.log(`    Health check endpoint`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
