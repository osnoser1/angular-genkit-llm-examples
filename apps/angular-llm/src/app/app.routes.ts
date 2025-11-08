import { Routes } from '@angular/router';
import { GenkitBlogComponent } from './genkit-blog.component';
import { GenkitKanbanComponent } from './genkit-kanban.component';

export const routes: Routes = [
  {
    path: '',
    component: GenkitBlogComponent,
  },
  {
    path: 'kanban',
    component: GenkitKanbanComponent,
  },
];
