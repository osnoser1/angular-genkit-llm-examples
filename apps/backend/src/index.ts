import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { expressHandler } from '@genkit-ai/express';
import express from 'express';
import cors from 'cors';

// Initialize Genkit with Google AI plugin
const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'),
});

// Define schemas for structured output using Zod
const BlogPostSchema = z.object({
  title: z.string().describe('The title of the blog post'),
  summary: z.string().describe('A brief 2-3 sentence summary'),
  mainPoints: z.array(z.string()).describe('3-5 main points from the post'),
  readingTime: z.number().describe('Estimated reading time in minutes'),
  tags: z.array(z.string()).describe('Relevant tags for the post'),
});

const BlogPostsSchema = z.array(BlogPostSchema);

// Define typed flows with input and output schemas

// Flow 1: Blog Post Analysis with Structured Output
export const analyzeBlogPostFlow = ai.defineFlow(
  {
    name: 'analyzeBlogPost',
    inputSchema: z.object({
      topic: z.string().describe('Blog post topic'),
      audience: z.string().optional().describe('Target audience'),
    }),
    outputSchema: BlogPostsSchema,
  },
  async ({ audience, topic }, { sendChunk }) => {
    const prompt = `Create six detailed blog post outline about "${topic}"${
      audience ? ` for ${audience}` : ''
    }. Structure it with a compelling title, summary, main points, reading time estimate, and tags.`;

    const { stream, response } = ai.generateStream({
      prompt,
      output: { schema: BlogPostsSchema },
    });

    for await (const chunk of stream) {
      sendChunk(chunk.output);
    }

    const finalResponse = await response;
    return finalResponse.output!;
  }
);


// Setup Express app
const app = express();
app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Expose flows as Express endpoints with streaming support
app.post('/api/analyze-blog-post', expressHandler(analyzeBlogPostFlow));

// Endpoint for structured output without streaming
app.post('/api/structured-output', async (req, res) => {
  const { topic, audience } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    const prompt = `Create a detailed blog post outline about "${topic}"${
      audience ? ` for ${audience}` : ''
    }. Structure it with a compelling title, summary, main points, reading time estimate, and tags.`;

    const { output } = await ai.generate({
      prompt,
      output: { schema: BlogPostSchema },
    });

    res.json({ success: true, data: output });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 API Endpoints:`);
  console.log(`  - POST /api/analyze-blog-post (streaming structured output)`);
  console.log(`  - POST /api/structured-output (non-streaming structured output)`);
  console.log(`  - GET /health`);
});