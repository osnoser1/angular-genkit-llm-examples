import { z } from '../config/ai.ts';

/**
 * Zod schemas for blog-related data structures
 * Ensures type safety and validation for all blog operations
 */

export const SubtopicSchema = z.object({
  id: z.string().describe('Unique identifier for the subtopic'),
  title: z.string().describe('The subtopic title'),
  description: z.string().describe('Brief description of the subtopic'),
});

export const SubtopicsSchema = z.array(SubtopicSchema);

export const BlogPostSummarySchema = z.object({
  id: z.string().describe('Unique identifier for the blog post'),
  title: z.string().describe('The blog post title'),
  summary: z.string().describe('Compelling 2-3 sentence summary'),
  readingTime: z.number().describe('Estimated reading time in minutes'),
});

export const BlogPostSummariesSchema = z.array(BlogPostSummarySchema);

export const BlogPostSchema = z.object({
  title: z.string().describe('The blog post title'),
  summary: z.string().describe('Compelling 2-3 sentence summary'),
  mainPoints: z.array(z.string()).describe('5-7 main points from the post'),
  readingTime: z.number().describe('Estimated reading time in minutes'),
  tags: z.array(z.string()).describe('Relevant tags for the post'),
  content: z.string().describe('The complete blog post content'),
});

export const BlogPostsSchema = z.array(BlogPostSchema);

export type Subtopic = z.infer<typeof SubtopicSchema>;
export type BlogPostSummary = z.infer<typeof BlogPostSummarySchema>;
export type BlogPost = z.infer<typeof BlogPostSchema>;

/**
 * Request validation schemas for API endpoints
 */

export const GenerateSubtopicsRequestSchema = z.object({
  topic: z
    .string()
    .min(1, 'Topic is required')
    .max(500, 'Topic must be less than 500 characters'),
});

export const GenerateBlogPostSummariesRequestSchema = z.object({
  topic: z
    .string()
    .min(1, 'Topic is required')
    .max(500, 'Topic must be less than 500 characters'),
  subtopic: z
    .string()
    .min(1, 'Subtopic is required')
    .max(500, 'Subtopic must be less than 500 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be less than 1000 characters')
    .describe('Subtopic description for context'),
});

export const GenerateCompleteBlogPostRequestSchema = z.object({
  topic: z
    .string()
    .min(1, 'Topic is required')
    .max(500, 'Topic must be less than 500 characters'),
  subtopic: z
    .string()
    .min(1, 'Subtopic is required')
    .max(500, 'Subtopic must be less than 500 characters'),
  summary: z
    .string()
    .min(1, 'Summary is required')
    .max(1000, 'Summary must be less than 1000 characters'),
  readingTime: z
    .number()
    .min(1, 'Reading time must be at least 1 minute')
    .max(60, 'Reading time must not exceed 60 minutes')
    .describe('Estimated reading time in minutes'),
});

export type GenerateSubtopicsRequest = z.infer<
  typeof GenerateSubtopicsRequestSchema
>;
export type GenerateBlogPostSummariesRequest = z.infer<
  typeof GenerateBlogPostSummariesRequestSchema
>;
export type GenerateCompleteBlogPostRequest = z.infer<
  typeof GenerateCompleteBlogPostRequestSchema
>;

/**
 * Legacy endpoints request schemas
 */

export const AnalyzeBlogPostFlowRequestSchema = z.object({
  topic: z
    .string()
    .min(1, 'Topic is required')
    .max(500, 'Topic must be less than 500 characters')
    .describe('Blog post topic'),
  audience: z
    .string()
    .max(500, 'Audience must be less than 500 characters')
    .optional()
    .describe('Target audience'),
});

export const StructuredOutputRequestSchema = z.object({
  topic: z
    .string()
    .min(1, 'Topic is required')
    .max(500, 'Topic must be less than 500 characters')
    .describe('Blog post topic'),
  audience: z
    .string()
    .max(500, 'Audience must be less than 500 characters')
    .optional()
    .describe('Target audience'),
});
