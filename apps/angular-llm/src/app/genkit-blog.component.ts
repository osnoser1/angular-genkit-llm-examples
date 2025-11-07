import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { streamFlow } from 'genkit/beta/client';
import { firstValueFrom } from 'rxjs';

interface BlogPost {
  title: string;
  summary: string;
  mainPoints: string[];
  readingTime: number;
  tags: string[];
}

@Component({
  selector: 'app-genkit-blog',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <h1>🚀 Genkit Blog Post Generator</h1>

      <div class="input-section">
        <h2>Blog Post Settings</h2>
        <div class="form-group">
          <label for="topic">Topic:</label>
          <input
            id="topic"
            type="text"
            [(ngModel)]="topic"
            placeholder="e.g., Machine Learning, Web Development"
            [disabled]="isLoading()"
          />
        </div>

        <div class="form-group">
          <label for="audience">Target Audience (optional):</label>
          <input
            id="audience"
            type="text"
            [(ngModel)]="audience"
            placeholder="e.g., beginners, professionals"
            [disabled]="isLoading()"
          />
        </div>

        <div class="button-group">
          <button
            (click)="generateStreaming()"
            [disabled]="isLoading() || !topic"
            class="btn btn-primary"
          >
            {{ isLoading() ? '⏳ Streaming...' : '🌊 Stream Generation' }}
          </button>

          <button
            (click)="generateNonStreaming()"
            [disabled]="isLoading() || !topic"
            class="btn btn-secondary"
          >
            {{ isLoading() ? '⏳ Loading...' : '⚡ Generate' }}
          </button>
        </div>

        @if (error()) {
          <div class="error-message">❌ Error: {{ error() }}</div>
        }
      </div>

      <!-- Streaming Results Section -->
      @if (streamedData(); as posts) {
        <div class="results-section streaming">
          <h2>🌊 Streaming Output</h2>
          @for (post of posts; track post) {
            <div class="parsed-data">
              <h3>{{ post.title }}</h3>
              <p><strong>Reading Time:</strong> {{ post.readingTime }} min</p>
              <p><strong>Tags:</strong> {{ post.tags?.join(', ') }}</p>
              <p><strong>Main Points:</strong> {{ post.mainPoints?.join(', ') }}</p>
              <p><strong>Summary:</strong> {{ post.summary }}</p>
            </div>
          }
        </div>
      }

      <!-- Non-Streaming Results Section -->
      @if (blogPost(); as post) {
        <div class="results-section">
          <h2>📝 Generated Blog Post</h2>
          <div class="blog-card">
            <h3>{{ post.title }}</h3>
            <p class="summary">{{ post.summary }}</p>

            <div class="metadata">
              <span class="reading-time">⏱️ {{ post.readingTime }} min read</span>
            </div>

            <div class="main-points">
              <h4>📌 Main Points:</h4>
              <ul>
                @for (point of post.mainPoints; track point) {
                  <li>{{ point }}</li>
                }
              </ul>
            </div>

            <div class="tags">
              <strong>Tags:</strong>
              <div class="tag-list">
                @for (tag of post.tags; track tag) {
                  <span class="tag">{{ tag }}</span>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    h1 {
      color: #1f2937;
      margin-bottom: 30px;
      text-align: center;
    }

    h2 {
      color: #374151;
      font-size: 1.3em;
      margin-top: 25px;
      margin-bottom: 15px;
    }

    .input-section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }

    .form-group {
      margin-bottom: 15px;
      display: flex;
      flex-direction: column;
    }

    label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 5px;
      font-size: 0.95em;
    }

    input {
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1em;
      transition: border-color 0.2s;
    }

    input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    input:disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
    }

    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .btn {
      flex: 1;
      padding: 12px 16px;
      font-size: 1em;
      font-weight: 600;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px rgba(245, 87, 108, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .error-message {
      margin-top: 15px;
      padding: 12px;
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 6px;
      color: #c53030;
      font-size: 0.95em;
    }

    .results-section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .results-section.streaming {
      border-left: 4px solid #667eea;
    }

    .streaming-content {
      background: white;
      padding: 15px;
      border-radius: 6px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
      line-height: 1.6;
      color: #1f2937;
      max-height: 300px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .cursor {
      display: inline-block;
      animation: blink 1s infinite;
      color: #667eea;
    }

    @keyframes blink {
      0%,
      49% {
        opacity: 1;
      }
      50%,
      100% {
        opacity: 0;
      }
    }

    .parsed-data {
      margin-top: 15px;
      padding: 12px;
      background: white;
      border-radius: 6px;
      border-left: 3px solid #667eea;
    }

    .parsed-data h3 {
      margin: 0 0 8px 0;
      color: #1f2937;
    }

    .blog-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .blog-card h3 {
      color: #1f2937;
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 1.4em;
    }

    .summary {
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 15px;
    }

    .metadata {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      padding: 12px;
      background: #f3f4f6;
      border-radius: 6px;
    }

    .reading-time {
      color: #6b7280;
      font-size: 0.95em;
    }

    .main-points {
      margin-bottom: 20px;
    }

    .main-points h4 {
      color: #374151;
      margin: 0 0 10px 0;
    }

    .main-points ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .main-points li {
      padding: 8px 0 8px 24px;
      position: relative;
      color: #6b7280;
      line-height: 1.6;
    }

    .main-points li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }

    .tags {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .tags strong {
      color: #374151;
      display: block;
      margin-bottom: 10px;
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      display: inline-block;
      padding: 4px 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 500;
    }
  `,
})
export class GenkitBlogComponent {
  topic = signal<string | undefined>(undefined);
  audience = signal<string | undefined>(undefined);
  blogPost = signal<BlogPost | undefined>(undefined);
  streamedData = signal<Partial<BlogPost>[] | undefined>(undefined);
  isLoading = signal(false);
  error = signal('');

  private httpClient = inject(HttpClient);

  private readonly API_URL = 'http://localhost:3000/api';

  async generateNonStreaming() {
    this.isLoading.set(true);
    this.blogPost.set(undefined);
    try {
      const result = await firstValueFrom(
        this.httpClient.post<{ data: BlogPost; success: boolean }>(
          `${this.API_URL}/structured-output`,
          { topic: this.topic(), audience: this.audience() },
        ),
      );
      this.blogPost.set(result.success ? result.data : undefined);
    } catch (err) {
      this.handleError(err);
    } finally {
      this.isLoading.set(false);
      setTimeout(() => globalThis.scrollTo(0, document.body.scrollHeight));
    }
  }

  async generateStreaming() {
    this.error.set('');
    this.isLoading.set(true);
    this.streamedData.set(undefined);

    try {
      const result = streamFlow<BlogPost[], Partial<BlogPost>[]>({
        url: `${this.API_URL}/analyze-blog-post`,
        input: { topic: this.topic(), audience: this.audience() },
      });

      for await (const chunk of result.stream) {
        this.streamedData.set(chunk);
        globalThis.scrollTo(0, document.body.scrollHeight);
      }

      const finalOutput = await result.output;
      if (finalOutput) {
        this.streamedData.set(finalOutput);
      }
    } catch (err) {
      this.handleError(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private handleError(err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    this.error.set(message);
    console.error('Error:', err);
  }
}
