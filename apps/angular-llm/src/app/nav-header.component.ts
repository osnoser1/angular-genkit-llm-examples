import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="border-b border-gray-200 bg-white shadow-sm">
      <div
        class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"
      >
        <h1 class="text-2xl font-bold text-gray-900">📝 Genkit Blog</h1>

        <div class="flex gap-4">
          <a
            routerLink="/"
            routerLinkActive="border-b-2 border-indigo-500 text-indigo-600"
            [routerLinkActiveOptions]="{ exact: true }"
            class="px-4 py-2 font-medium text-gray-700 transition-colors hover:text-indigo-600"
          >
            📋 Blog Posts
          </a>
          <a
            routerLink="/kanban"
            routerLinkActive="border-b-2 border-indigo-500 text-indigo-600"
            class="px-4 py-2 font-medium text-gray-700 transition-colors hover:text-indigo-600"
          >
            📊 Kanban Board
          </a>
        </div>
      </div>
    </nav>
  `,
})
export class NavHeaderComponent {}
