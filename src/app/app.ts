import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header';
import { TodoListComponent } from './features/todos/components/todo-list';
import { NotificationsComponent } from './shared/components/notifications/notifications';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, TodoListComponent, NotificationsComponent],
  template: `
    <app-header></app-header>
    <main class="container mx-auto p-4">
      <router-outlet></router-outlet>
      <app-notifications></app-notifications>
    </main>
  `,
  styles: [],
})

export class App {
  protected readonly title = signal('angular-M2');
}
