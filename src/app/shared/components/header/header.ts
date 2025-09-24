import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth';
import { TodoService } from '../../../features/todos/services/todo';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="bg-violet-500 text-white border-b-2 p-4">
      <div class="container mx-auto flex justify-between items-center">
      <ul>
        <li><a routerLink="/todos" class="text-2xl font-bold">TodoList App</a></li>
        </ul>
        <nav>
          <ul class="flex space-x-4">
            @if (currentUser()) {
              <li><button class="bg-transparent hover:bg-violet-700 font-semibold py-2 px-4 rounded"><a routerLink="/todos" class="hover:text-blue-200">Todos</a></button></li>
              @if (currentUser()?.role === 'admin') {
                <li><button class="bg-transparent hover:bg-violet-700 font-semibold py-2 px-4 rounded"><a routerLink="/admin">Admin</a></button></li>
              }
              <li><button (click)="logout()" class="bg-transparent hover:bg-violet-700 font-semibold py-2 px-4 border border-white hover:border-transparent rounded">Logout</button></li>
            } @else {
              <li><a routerLink="/auth/login" class="hover:text-blue-200">Login</a></li>
              <li><a routerLink="/auth/register" class="hover:text-blue-200">Register</a></li>
            }
          </ul>
        </nav>
      </div>
    </header>
  `,
  styles: [],
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private todoService = inject(TodoService);

  // Writable signals for internal state management
  private readonly _internalState = signal({ lastUpdated: new Date() });

  // Computed signals - reactive derived state
  public readonly currentUser = computed(() => this.authService.currentUser$());
  public readonly userStats = computed(() => {
    const user = this.currentUser();
    if (!user) return null;

    return {
      name: user.name,
      isAdmin: user.role === 'admin',
      // Uses TodoService signals for reactive todos count
      todosCount: this.todoService.todos().length,
      completedCount: this.todoService.todos().filter(t => t.status === 'done').length
    };
  });

  constructor() {
    this.setupEffects();
  }

  // Effects setup - side effects that react to signal changes
  private setupEffects() {
    // Effect: Update internal state when user changes
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this._internalState.set({ lastUpdated: new Date() });
      }
    }, { allowSignalWrites: true });

    // Effect: Log user statistics for debugging
    effect(() => {
      const stats = this.userStats();
      if (stats) {
        console.warn(`User: ${stats.name}, Todos: ${stats.todosCount}, Completed: ${stats.completedCount}`);
      }
    }, { allowSignalWrites: false });
  }

  // User logout functionality
  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
