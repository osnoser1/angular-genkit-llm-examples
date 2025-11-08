import { ai } from '../config/ai.ts';
import {
  SubtopicsSchema,
  BlogPostSummariesSchema,
  BlogPostsSchema,
  BlogPostSchema,
  GenerateSubtopicsRequestSchema,
  GenerateBlogPostSummariesRequestSchema,
  GenerateCompleteBlogPostRequestSchema,
  AnalyzeBlogPostFlowRequestSchema,
} from '../schemas/blog.ts';

/**
 * Blog Service - Handles all blog generation operations
 * Defines Genkit flows with streaming support for all endpoints
 * Each flow has a single, well-defined responsibility
 */

/**
 * Flow: Generate subtopics for a topic (streaming)
 */
export const generateSubtopicsFlow = ai.defineFlow(
  {
    name: 'generateSubtopics',
    inputSchema: GenerateSubtopicsRequestSchema,
    outputSchema: SubtopicsSchema,
  },
  async ({ topic }, { sendChunk }) => {
    const prompt = `Generate 5-7 unique and compelling subtopics for the main topic: "${topic}". 
For each subtopic, provide a clear title and a brief description that explains how it relates to the main topic.
Ensure the subtopics are diverse, cover different aspects of the topic, and would appeal to a general audience.`;

    const { stream, response } = ai.generateStream({
      prompt,
      output: { schema: SubtopicsSchema },
    });

    for await (const chunk of stream) {
      if (chunk.output) {
        sendChunk(chunk.output);
      }
    }

    const finalResponse = await response;
    return finalResponse.output!;
  },
);

/**
 * Flow: Generate blog post summaries (streaming)
 */
export const generateBlogPostSummariesFlow = ai.defineFlow(
  {
    name: 'generateBlogPostSummaries',
    inputSchema: GenerateBlogPostSummariesRequestSchema,
    outputSchema: BlogPostSummariesSchema,
  },
  async ({ topic, subtopic, description }, { sendChunk }) => {
    const prompt = `Generate 4-6 blog post ideas for the topic "${topic}" with a focus on the subtopic "${subtopic}".

Subtopic Description: "${description}"

For each blog post, provide:
- A unique ID (e.g., post-1, post-2, etc.)
- A captivating 2-3 sentence summary that hooks the reader

Make sure the blog posts are diverse and cover different angles of the subtopic.
Each post should be unique and provide distinct value to the reader.`;

    const { stream, response } = ai.generateStream({
      prompt,
      output: { schema: BlogPostSummariesSchema },
    });

    for await (const chunk of stream) {
      if (chunk.output) {
        sendChunk(chunk.output);
      }
    }

    const finalResponse = await response;
    return finalResponse.output!;
  },
);

/**
 * Flow: Generate complete blog post (streaming)
 */
export const generateCompleteBlogPostFlow = ai.defineFlow(
  {
    name: 'generateCompleteBlogPost',
    inputSchema: GenerateCompleteBlogPostRequestSchema,
    outputSchema: BlogPostSchema,
  },
  async ({ topic, subtopic, summary, audience }, { sendChunk }) => {
    const audienceContext = audience ? ` for ${audience}` : '';
    const prompt = `Create a complete, well-structured blog post based on the following:
Main Topic: "${topic}"
Subtopic: "${subtopic}"
Summary: "${summary}"${audience ? `\nTarget Audience: ${audience}` : ''}

Structure the blog post with:
- A compelling and SEO-optimized title
- An engaging 2-3 sentence summary (same or improved version of the provided summary)
- 5-7 main points or sections with detailed explanations
- Estimated reading time in minutes (based on the content length, typically 5-15 minutes)
- 5-8 relevant tags
- Well-written, comprehensive content that is informative, engaging, and reader-friendly${audienceContext}

Make the content original, valuable, and suitable for publishing on a professional blog.
Ensure the writing style is clear, accessible, and maintains reader engagement throughout.`;

    const { stream, response } = ai.generateStream({
      prompt,
      output: { schema: BlogPostSchema },
    });

    for await (const chunk of stream) {
      if (chunk.output) {
        sendChunk(chunk.output);
      }
    }

    const finalResponse = await response;
    return finalResponse.output!;
  },
);

/**
 * Flow: Analyze blog post (legacy, streaming)
 * Returns an array of blog posts
 */
export const analyzeBlogPostFlow = ai.defineFlow(
  {
    name: 'analyzeBlogPost',
    inputSchema: AnalyzeBlogPostFlowRequestSchema,
    outputSchema: BlogPostsSchema,
  },
  async ({ topic, audience }, { sendChunk }) => {
    const prompt = `Create six detailed blog post outlines about "${topic}"${
      audience ? ` for ${audience}` : ''
    }. Structure each with a compelling title, summary, main points, reading time estimate, and tags.`;

    const { stream, response } = ai.generateStream({
      prompt,
      output: { schema: BlogPostsSchema },
    });

    for await (const chunk of stream) {
      if (chunk.output) {
        sendChunk(chunk.output);
      }
    }

    const finalResponse = await response;
    return finalResponse.output!;
  },
);

/**
 * Non-streaming handler for structured output (legacy endpoint)
 * Uses direct ai.generate instead of ai.defineFlow for backward compatibility
 */
export async function generateStructuredOutput(input: {
  topic: string;
  audience?: string;
}): Promise<any> {
  const { topic, audience } = input;
  const prompt = `Create a detailed blog post outline about "${topic}"${
    audience ? ` for ${audience}` : ''
  }. Structure it with a compelling title, summary, main points, reading time estimate, and tags.`;

  const response = await ai.generate({
    prompt,
    output: { schema: BlogPostSchema },
  } as never);

  return response.output!;
}
