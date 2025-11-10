import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { streamFlow } from 'genkit/beta/client';

interface CardError {
  type: 'summary' | 'post' | 'network' | 'validation' | 'timeout';
  message: string;
  timestamp: Date;
  retryCount: number;
}

interface KanbanCard {
  id: string;
  title?: string;
  summary?: string;
  readingTime?: number;
  tags?: string[];
  error?: CardError;
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

        @if (columns().length === 0 && isGenerating()) {
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
            @for (
              column of columns();
              track column.subtopic;
              let colIdx = $index
            ) {
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
                        [class]="
                          'rounded-md p-4 shadow-sm transition-all ' +
                          (card.error
                            ? 'border-2 border-red-300 bg-red-50'
                            : 'cursor-pointer bg-white hover:shadow-md hover:ring-2 hover:ring-indigo-300')
                        "
                      >
                        <!-- Error Banner -->
                        @if (card.error) {
                          <div
                            class="mb-3 rounded-md p-2"
                            [ngClass]="{
                              'bg-red-100 border-l-4 border-red-500':
                                card.error.type === 'post' ||
                                card.error.type === 'validation',
                              'bg-yellow-100 border-l-4 border-yellow-500':
                                card.error.type === 'network' ||
                                card.error.type === 'timeout',
                              'bg-orange-100 border-l-4 border-orange-500':
                                card.error.type === 'summary',
                            }"
                          >
                            <p
                              class="mb-2 text-xs font-semibold"
                              [ngClass]="{
                                'text-red-700':
                                  card.error.type === 'post' ||
                                  card.error.type === 'validation',
                                'text-yellow-700':
                                  card.error.type === 'network' ||
                                  card.error.type === 'timeout',
                                'text-orange-700':
                                  card.error.type === 'summary',
                              }"
                            >
                              @switch (card.error.type) {
                                @case ('network') {
                                  🌐 Connection Error
                                }
                                @case ('timeout') {
                                  ⏱️ Timeout
                                }
                                @case ('post') {
                                  💭 Generation Failed
                                }
                                @case ('validation') {
                                  ⚠️ Invalid Response
                                }
                                @case ('summary') {
                                  📋 Summary Failed
                                }
                              }
                            </p>
                            <p
                              class="text-xs"
                              [ngClass]="{
                                'text-red-600':
                                  card.error.type === 'post' ||
                                  card.error.type === 'validation',
                                'text-yellow-600':
                                  card.error.type === 'network' ||
                                  card.error.type === 'timeout',
                                'text-orange-600':
                                  card.error.type === 'summary',
                              }"
                            >
                              {{ card.error.message }}
                            </p>
                            <div class="mt-2 flex gap-2">
                              <button
                                (click)="retryCard(colIdx, card.id!)"
                                class="text-xs font-medium text-blue-600 hover:underline"
                              >
                                🔄 Retry ({{ card.error.retryCount }})
                              </button>
                              <button
                                (click)="dismissCardError(colIdx, card.id!)"
                                class="text-xs font-medium text-gray-600 hover:underline"
                              >
                                ✕ Dismiss
                              </button>
                            </div>
                          </div>
                        }

                        <!-- Title: Shows content or skeleton -->
                        @if (card.title) {
                          <h3
                            class="mb-2 line-clamp-2 font-semibold text-gray-900"
                          >
                            {{ card.title }}
                          </h3>
                        } @else if (!card.error) {
                          <div
                            class="mb-2 h-6 w-full animate-pulse rounded bg-gray-200"
                          ></div>
                        }

                        <!-- Summary: Shows content or skeleton -->
                        @if (card.summary) {
                          <p class="mb-3 line-clamp-3 text-xs text-gray-600">
                            {{ card.summary }}
                          </p>
                        } @else if (!card.error) {
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
                        @if (!card.error) {
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
                        }
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

  private readonly API_URL = 'http://localhost:3000/api';

  getTotalCards(): number {
    return this.columns().reduce((total, col) => total + col.cards.length, 0);
  }

  private updateColumnsFromSubtopics(
    subtopics: Partial<{ id: string; title: string; description: string }>[],
  ): void {
    const columns: KanbanColumn[] = subtopics.map((sub) => ({
      subtopic: sub.title ?? '',
      description: sub.description ?? '',
      cards: [],
      isLoading: true,
    }));
    this.columns.set(columns);
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
      // Step 1: Get subtopics (streaming)
      const subtopicsResult = streamFlow<
        { id: string; title: string; description: string }[],
        Partial<{ id: string; title: string; description: string }>[]
      >({
        url: `${this.API_URL}/blog/subtopics`,
        input: { topic: this.topic() },
      });

      let subtopics: { id: string; title: string; description: string }[] = [];

      // Stream subtopics and show them progressively
      for await (const chunk of subtopicsResult.stream) {
        // Update UI with progressive columns as they arrive
        this.updateColumnsFromSubtopics(chunk);
      }

      // Get final result and update UI
      const finalSubtopics = await subtopicsResult.output;
      if (finalSubtopics) {
        subtopics = finalSubtopics;
        this.updateColumnsFromSubtopics(subtopics);
      }

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
    try {
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
    } catch (err) {
      console.error('Error fetching summaries:', err);
    }
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
    try {
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
    } catch (err) {
      this.handleCardError(columnIndex, summary.id, err, 'post');
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

  private classifyError(err: unknown): CardError['type'] {
    const errorMsg = err instanceof Error ? err.message.toLowerCase() : '';

    if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
      return 'timeout';
    }
    if (
      errorMsg.includes('network') ||
      errorMsg.includes('connection') ||
      errorMsg.includes('fetch')
    ) {
      return 'network';
    }
    if (errorMsg.includes('validation') || errorMsg.includes('schema')) {
      return 'validation';
    }

    return 'post';
  }

  private getErrorMessage(err: unknown, type: CardError['type']): string {
    if (err instanceof Error) {
      return err.message;
    }

    const messages: Record<CardError['type'], string> = {
      network: 'Network connection failed. Check your internet connection.',
      timeout: 'Request timed out. Please try again.',
      post: 'Failed to generate blog post. Please retry.',
      validation: 'Server returned invalid data. Please retry.',
      summary: 'Failed to fetch summary. Please retry.',
    };

    return messages[type] || 'An error occurred. Please retry.';
  }

  private handleCardError(
    columnIndex: number,
    cardId: string,
    err: unknown,
    phase: 'summary' | 'post',
  ): void {
    const errorType = this.classifyError(err);
    const message = this.getErrorMessage(err, errorType);

    console.error(`[${cardId}] ${phase} phase failed:`, err);

    this.setCardError(columnIndex, cardId, errorType, message);
  }

  private setCardError(
    columnIndex: number,
    cardId: string,
    type: CardError['type'],
    message: string,
  ): void {
    this.columns.update((cols) => {
      const newCols = [...cols];
      const cardIndex = newCols[columnIndex].cards.findIndex(
        (c) => c.id === cardId,
      );

      if (cardIndex >= 0) {
        const currentCard = newCols[columnIndex].cards[cardIndex];
        const currentError = currentCard.error;
        const retryCount = currentError ? currentError.retryCount : 0;

        newCols[columnIndex].cards[cardIndex] = {
          ...currentCard,
          error: {
            type,
            message,
            timestamp: new Date(),
            retryCount,
          },
        };
      }

      return newCols;
    });
  }

  private clearCardError(columnIndex: number, cardId: string): void {
    this.columns.update((cols) => {
      const newCols = [...cols];
      const cardIndex = newCols[columnIndex].cards.findIndex(
        (c) => c.id === cardId,
      );

      if (cardIndex >= 0) {
        const currentCard = newCols[columnIndex].cards[cardIndex];
        const newCard: Partial<KanbanCard> = {
          ...currentCard,
          error: undefined,
        };
        newCols[columnIndex].cards[cardIndex] = newCard;
      }

      return newCols;
    });
  }

  dismissCardError(columnIndex: number, cardId: string): void {
    this.clearCardError(columnIndex, cardId);
  }

  async retryCard(columnIndex: number, cardId: string): Promise<void> {
    // Find the card and summary
    const card = this.columns()[columnIndex].cards.find((c) => c.id === cardId);
    if (!card) {
      return;
    }

    // Increment retry count
    this.columns.update((cols) => {
      const newCols = [...cols];
      const cardIndex = newCols[columnIndex].cards.findIndex(
        (c) => c.id === cardId,
      );

      if (cardIndex >= 0 && newCols[columnIndex].cards[cardIndex].error) {
        const error = newCols[columnIndex].cards[cardIndex].error!;
        error.retryCount += 1;
        newCols[columnIndex].cards[cardIndex].error = { ...error };
      }

      return newCols;
    });

    // Find column and topic info
    const columnData = this.columns()[columnIndex];
    const subtopic = columnData.subtopic;
    const description = columnData.description;

    // Retry fetching complete post
    await this.fetchCompleteBlogPost(
      columnIndex,
      {
        id: 'retry',
        title: subtopic,
        description,
      },
      {
        id: cardId,
        summary: card.summary || '',
      },
    );
  }
}
