import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavHeaderComponent } from './nav-header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavHeaderComponent],
  template: `
    <app-nav-header></app-nav-header>
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = signal('angular-llm');
}
