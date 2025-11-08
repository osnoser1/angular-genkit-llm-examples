import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
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
    <div class="mx-auto max-w-3xl px-5 py-8">
      <h1 class="mb-8 text-center text-3xl font-bold text-gray-800">
        🚀 Genkit Blog Post Generator
      </h1>

      <div class="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 class="mb-6 text-xl font-semibold text-gray-700">
          Blog Post Settings
        </h2>
        <div class="mb-4 flex flex-col">
          <label for="topic" class="mb-2 text-sm font-semibold text-gray-700"
            >Topic:</label
          >
          <input
            id="topic"
            type="text"
            [(ngModel)]="topic"
            placeholder="e.g., Machine Learning, Web Development"
            [disabled]="isLoading()"
            class="rounded-md border border-gray-300 px-3 py-2 font-normal transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </div>

        <div class="mb-6 flex flex-col">
          <label for="audience" class="mb-2 text-sm font-semibold text-gray-700"
            >Target Audience (optional):</label
          >
          <input
            id="audience"
            type="text"
            [(ngModel)]="audience"
            placeholder="e.g., beginners, professionals"
            [disabled]="isLoading()"
            class="rounded-md border border-gray-300 px-3 py-2 font-normal transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </div>

        <div class="mb-4 flex gap-3">
          <button
            (click)="generateStreaming()"
            [disabled]="isLoading() || !topic"
            class="flex-1 rounded-md bg-linear-to-r from-indigo-500 to-purple-600 px-4 py-3 font-semibold text-white transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg enabled:hover:shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ isLoading() ? '⏳ Streaming...' : '🌊 Stream Generation' }}
          </button>

          <button
            (click)="generateNonStreaming()"
            [disabled]="isLoading() || !topic"
            class="flex-1 rounded-md bg-linear-to-r from-pink-400 to-rose-500 px-4 py-3 font-semibold text-white transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg enabled:hover:shadow-pink-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ isLoading() ? '⏳ Loading...' : '⚡ Generate' }}
          </button>
        </div>

        @if (error()) {
          <div
            class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            ❌ Error: {{ error() }}
          </div>
        }
      </div>

      <!-- Streaming Results Section -->
      @if (streamedData(); as posts) {
        <div
          class="mb-6 rounded-lg border border-gray-200 border-l-4 border-l-indigo-500 bg-gray-50 p-6"
        >
          <h2 class="mb-4 text-xl font-semibold text-gray-700">
            🌊 Streaming Output
          </h2>
          @for (post of posts; track post) {
            <div
              class="mb-4 rounded-md border-l-4 border-l-indigo-500 bg-white p-3"
            >
              <h3 class="mb-2 font-semibold text-gray-900">{{ post.title }}</h3>
              <p class="text-sm text-gray-600">
                <strong>Reading Time:</strong> {{ post.readingTime }} min
              </p>
              <p class="text-sm text-gray-600">
                <strong>Tags:</strong> {{ post.tags?.join(', ') }}
              </p>
              <p class="text-sm text-gray-600">
                <strong>Main Points:</strong> {{ post.mainPoints?.join(', ') }}
              </p>
              <p class="text-sm text-gray-600">
                <strong>Summary:</strong> {{ post.summary }}
              </p>
            </div>
          }
        </div>
      }

      <!-- Non-Streaming Results Section -->
      @if (blogPost(); as post) {
        <div class="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h2 class="mb-4 text-xl font-semibold text-gray-700">
            📝 Generated Blog Post
          </h2>
          <div class="rounded-lg bg-white p-6 shadow-sm">
            <h3 class="mb-4 text-2xl font-bold text-gray-900">
              {{ post.title }}
            </h3>
            <p class="mb-4 leading-relaxed text-gray-600">{{ post.summary }}</p>

            <div
              class="mb-5 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-600"
            >
              <span>⏱️ {{ post.readingTime }} min read</span>
            </div>

            <div class="mb-6">
              <h4 class="mb-3 font-semibold text-gray-800">📌 Main Points:</h4>
              <ul class="space-y-2">
                @for (point of post.mainPoints; track point) {
                  <li class="flex gap-2 text-gray-600">
                    <span class="font-bold text-indigo-500">✓</span>
                    <span>{{ point }}</span>
                  </li>
                }
              </ul>
            </div>

            <div class="border-t border-gray-200 pt-5">
              <p class="mb-3 block font-semibold text-gray-800">Tags:</p>
              <div class="flex flex-wrap gap-2">
                @for (tag of post.tags; track tag) {
                  <span
                    class="rounded-full bg-linear-to-r from-indigo-500 to-purple-600 px-3 py-1 text-xs font-medium text-white"
                  >
                    {{ tag }}
                  </span>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
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
    this.error.set('');
    this.isLoading.set(true);
    this.blogPost.set(undefined);
    this.streamedData.set(undefined);

    try {
      const result = await firstValueFrom(
        this.httpClient.post<{ data: BlogPost; success: boolean }>(
          `${this.API_URL}/blog/structured-output`,
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
    this.blogPost.set(undefined);

    try {
      const result = streamFlow<BlogPost[], Partial<BlogPost>[]>({
        url: `${this.API_URL}/blog/analyze-blog-post`,
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
    const message =
      err instanceof Error ? err.message : 'Unknown error occurred';
    this.error.set(message);
    console.error('Error:', err);
  }
}
