import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { expressHandler } from '@genkit-ai/express';
import * as blogService from '../services/blog-service.ts';
import { StructuredOutputRequestSchema } from '../schemas/blog.ts';

/**
 * Blog Router - Handles all blog-related endpoints
 * Uses Genkit flows with expressHandler for streaming support
 * Each endpoint has a single, well-defined responsibility
 */

const router = Router();

/**
 * POST /api/blog/subtopics
 * Generates subtopics for a given topic (streaming)
 */
router.post('/subtopics', expressHandler(blogService.generateSubtopicsFlow));

/**
 * POST /api/blog/post-summaries
 * Generates blog post summaries for a topic and subtopic (streaming)
 */
router.post(
  '/post-summaries',
  expressHandler(blogService.generateBlogPostSummariesFlow),
);

/**
 * POST /api/blog/post
 * Generates a complete blog post with all details (streaming)
 */
router.post('/post', expressHandler(blogService.generateCompleteBlogPostFlow));

/**
 * POST /api/analyze-blog-post
 * Legacy endpoint: Analyze and generate blog posts for a topic (streaming)
 */
router.post(
  '/analyze-blog-post',
  expressHandler(blogService.analyzeBlogPostFlow),
);

/**
 * POST /api/blog/structured-output
 * Legacy endpoint: Generate structured blog post output for a topic (non-streaming)
 */
router.post(
  '/structured-output',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = StructuredOutputRequestSchema.parse(req.body);
      const result = await blogService.generateStructuredOutput(input);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
