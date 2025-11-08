import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { streamFlow } from 'genkit/beta/client';

interface KanbanCard {
  id: string;
  title: string;
  summary: string;
  readingTime: number;
  tags: string[];
}

interface KanbanColumn {
  subtopic: string;
  description: string;
  cards: Partial<KanbanCard>[];
  isLoading: boolean;
}

interface BlogPost {
  title: string;
  summary: string;
  mainPoints: string[];
  readingTime: number;
  tags: string[];
  content: string;
}

@Component({
  selector: 'app-genkit-kanban',
  standalone: true,
  imports: [FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-screen bg-gray-100">
      <!-- Sidebar -->
      <aside class="w-80 border-r border-gray-200 bg-white p-6 shadow-sm">
        <h1 class="mb-8 text-2xl font-bold text-gray-900">📊 Kanban Board</h1>

        <div class="space-y-6">
          <div class="flex flex-col">
            <label for="topic" class="mb-2 text-sm font-semibold text-gray-700"
              >Topic:</label
            >
            <input
              id="topic"
              type="text"
              [(ngModel)]="topic"
              placeholder="e.g., Machine Learning"
              [disabled]="isGenerating()"
              class="rounded-md border border-gray-300 px-3 py-2 font-normal transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          <div class="flex flex-col">
            <label
              for="audience"
              class="mb-2 text-sm font-semibold text-gray-700"
              >Target Audience (optional):</label
            >
            <input
              id="audience"
              type="text"
              [(ngModel)]="audience"
              placeholder="e.g., beginners"
              [disabled]="isGenerating()"
              class="rounded-md border border-gray-300 px-3 py-2 font-normal transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          <button
            (click)="generateKanban()"
            [disabled]="isGenerating() || !topic"
            class="w-full rounded-md bg-linear-to-r from-indigo-500 to-purple-600 px-4 py-3 font-semibold text-white transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg enabled:hover:shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ isGenerating() ? '⏳ Generating...' : '🚀 Generate Kanban' }}
          </button>

          @if (error()) {
            <div
              class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              ❌ {{ error() }}
            </div>
          }

          @if (columns().length > 0) {
            <div class="border-t border-gray-200 pt-4">
              <p class="text-xs font-semibold uppercase text-gray-600">
                Board Stats
              </p>
              <div class="mt-3 space-y-2 text-sm">
                <p class="text-gray-700">
                  Columns:
                  <span class="font-semibold">{{ columns().length }}</span>
                </p>
                <p class="text-gray-700">
                  Total Cards:
                  <span class="font-semibold">{{ getTotalCards() }}</span>
                </p>
              </div>
            </div>
          }
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-auto">
        @if (columns().length === 0 && !isGenerating()) {
          <div
            class="flex h-full items-center justify-center text-center text-gray-500"
          >
            <div>
              <p class="mb-2 text-lg font-semibold">No kanban board yet</p>
              <p class="text-sm">Enter a topic and click "Generate Kanban"</p>
            </div>
          </div>
        }

        @if (isGenerating()) {
          <div
            class="flex h-full items-center justify-center text-center text-gray-600"
          >
            <div class="space-y-4">
              <div class="flex justify-center">
                <div
                  class="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-500"
                ></div>
              </div>
              <p class="text-lg font-semibold">Generating kanban board...</p>
            </div>
          </div>
        }

        @if (columns().length > 0) {
          <div class="flex gap-6 overflow-x-auto p-6">
            @for (column of columns(); track column.subtopic) {
              <div
                class="flex w-96 shrink-0 flex-col rounded-lg bg-gray-200 p-4"
              >
                <!-- Column Header -->
                <div class="mb-4 border-b-2 border-gray-300 pb-3">
                  <h2 class="font-bold text-gray-900">{{ column.subtopic }}</h2>
                  <p class="mt-1 text-xs text-gray-600">
                    {{ column.description }}
                  </p>
                  <p class="mt-2 text-xs font-semibold text-gray-700">
                    {{ column.cards.length }} posts
                  </p>
                </div>

                <!-- Cards -->
                @if (column.isLoading) {
                  <div class="flex flex-col gap-3">
                    @for (i of [1, 2, 3]; track i) {
                      <div
                        class="h-32 animate-pulse rounded-md bg-gray-300"
                      ></div>
                    }
                  </div>
                } @else {
                  <div class="flex flex-col gap-3">
                    @for (card of column.cards; track card.id) {
                      <div
                        class="cursor-pointer rounded-md bg-white p-4 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-indigo-300"
                      >
                        <!-- Title: Shows content or skeleton -->
                        @if (card.title) {
                          <h3
                            class="mb-2 line-clamp-2 font-semibold text-gray-900"
                          >
                            {{ card.title }}
                          </h3>
                        } @else {
                          <div
                            class="mb-2 h-6 w-full animate-pulse rounded bg-gray-200"
                          ></div>
                        }

                        <!-- Summary: Shows content or skeleton -->
                        @if (card.summary) {
                          <p class="mb-3 line-clamp-3 text-xs text-gray-600">
                            {{ card.summary }}
                          </p>
                        } @else {
                          <div class="mb-3 flex flex-col gap-1">
                            <div
                              class="h-3 w-full animate-pulse rounded bg-gray-200"
                            ></div>
                            <div
                              class="h-3 w-5/6 animate-pulse rounded bg-gray-200"
                            ></div>
                          </div>
                        }

                        <!-- Reading time and tags -->
                        <div class="flex items-center justify-between">
                          @if (card.readingTime) {
                            <span class="text-xs font-medium text-gray-700">
                              ⏱️ {{ card.readingTime }} min
                            </span>
                          } @else {
                            <div
                              class="h-4 w-16 animate-pulse rounded bg-gray-200"
                            ></div>
                          }

                          <!-- Tags: Shows content or skeleton -->
                          @if (card.tags && card.tags.length > 0) {
                            <div
                              class="flex flex-wrap gap-1 justify-end max-w-3/4"
                            >
                              @for (tag of card.tags.slice(0, 2); track tag) {
                                <span
                                  class="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
                                >
                                  {{ tag }}
                                </span>
                              }
                            </div>
                          } @else {
                            <div class="flex gap-1">
                              <div
                                class="h-5 w-12 animate-pulse rounded-full bg-gray-200"
                              ></div>
                              <div
                                class="h-5 w-12 animate-pulse rounded-full bg-gray-200"
                              ></div>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
})
export class GenkitKanbanComponent {
  topic = signal<string | undefined>(undefined);
  audience = signal<string | undefined>(undefined);
  columns = signal<KanbanColumn[]>([]);
  isGenerating = signal(false);
  error = signal('');

  private httpClient = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api';

  getTotalCards(): number {
    return this.columns().reduce((total, col) => total + col.cards.length, 0);
  }

  async generateKanban() {
    if (!this.topic()) {
      this.error.set('Please enter a topic');
      return;
    }

    this.error.set('');
    this.isGenerating.set(true);
    this.columns.set([]);

    try {
      // Step 1: Get subtopics
      const subtopicsResult = streamFlow<
        { id: string; title: string; description: string }[],
        { id: string; title: string; description: string }[]
      >({
        url: `${this.API_URL}/blog/subtopics`,
        input: { topic: this.topic() },
      });

      let subtopics: { id: string; title: string; description: string }[] = [];
      for await (const chunk of subtopicsResult.stream) {
        subtopics = chunk;
      }

      const finalSubtopics = await subtopicsResult.output;
      if (finalSubtopics) {
        subtopics = finalSubtopics;
      }

      // Initialize columns with empty cards
      const initialColumns: KanbanColumn[] = subtopics.map((sub) => ({
        subtopic: sub.title,
        description: sub.description,
        cards: [],
        isLoading: true,
      }));

      this.columns.set(initialColumns);
      this.isGenerating.set(false);

      // Step 2: Fetch summaries for all subtopics in parallel
      const summaryPromises = subtopics.map((subtopic, i) =>
        this.fetchSubtopicSummaries(i, subtopic),
      );

      await Promise.all(summaryPromises);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown error occurred';
      this.error.set(message);
      console.error('Error:', err);
    } finally {
      this.isGenerating.set(false);
    }
  }

  private async fetchSubtopicSummaries(
    columnIndex: number,
    subtopic: { id: string; title: string; description: string },
  ): Promise<void> {
    // Step 1: Fetch summaries
    const summariesResult = streamFlow<
      { id: string; summary: string }[],
      { id: string; summary: string }[]
    >({
      url: `${this.API_URL}/blog/post-summaries`,
      input: {
        topic: this.topic(),
        subtopic: subtopic.title,
        description: subtopic.description,
      },
    });

    let summaries: { id: string; summary: string }[] = [];

    // Stream summaries and show them in real-time
    for await (const chunk of summariesResult.stream) {
      summaries = chunk;
      // Create placeholder cards with summaries as they arrive
      this.createSummaryCardsInColumn(columnIndex, chunk);
    }

    const finalSummaries = await summariesResult.output;
    if (finalSummaries) {
      summaries = finalSummaries;
      this.createSummaryCardsInColumn(columnIndex, finalSummaries);
    }

    console.log('summaries', this.columns());

    // Step 2: Fetch complete post for each summary in parallel
    const postPromises = summaries.map((summary) =>
      this.fetchCompleteBlogPost(columnIndex, subtopic, summary),
    );

    await Promise.all(postPromises);
  }

  private createSummaryCardsInColumn(
    columnIndex: number,
    summaries: { id: string; summary: string }[],
  ): void {
    this.columns.update((cols) => {
      const newCols = [...cols];
      const cards: KanbanCard[] = summaries.map((summary) => ({
        id: summary.id,
        title: '',
        summary: summary.summary,
        readingTime: 0,
        tags: [],
      }));
      newCols[columnIndex].cards = cards;
      newCols[columnIndex].isLoading = false;
      return newCols;
    });
  }

  private async fetchCompleteBlogPost(
    columnIndex: number,
    subtopic: { id: string; title: string; description: string },
    summary: { id: string; summary: string },
  ): Promise<void> {
    const postResult = streamFlow<BlogPost, Partial<BlogPost>>({
      url: `${this.API_URL}/blog/post`,
      input: {
        topic: this.topic(),
        subtopic: subtopic.title,
        summary: summary.summary,
        audience: this.audience(),
      },
    });

    let blogPost = null;
    for await (const chunk of postResult.stream) {
      blogPost = chunk;
      this.addPostToColumn(columnIndex, summary.id, blogPost);
    }

    const finalPost = await postResult.output;
    if (finalPost) {
      this.addPostToColumn(columnIndex, summary.id, finalPost);
    }
  }

  private addPostToColumn(
    columnIndex: number,
    postId: string,
    post: Partial<BlogPost>,
  ): void {
    this.columns.update((cols) => {
      const newCols = [...cols];
      const cardIndex = newCols[columnIndex].cards.findIndex(
        (c) => c.id === postId,
      );

      const updatedCard: Partial<KanbanCard> = {
        id: postId,
        title: post.title,
        summary: post.summary,
        readingTime: post.readingTime,
        tags: post.tags,
      };

      if (cardIndex >= 0) {
        // Update existing card (was placeholder with summary)
        newCols[columnIndex].cards[cardIndex] = updatedCard;
      } else {
        // Add new card if not found (shouldn't happen)
        newCols[columnIndex].cards.push(updatedCard);
      }

      return newCols;
    });
  }
}
