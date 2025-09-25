import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth';
import { TodoService } from '../../todos/services/todo';
import { User } from '../../auth/models/user';
import { Todo } from '../../todos/models/todo';
import { StorageService } from '../../storage/services/localStorage';
import { NotificationService } from '../../../shared/service/notifications-service';
import { TableColumnsService } from '../../../shared/service/table-columns';
import { TableColumnsManagerComponent } from '../../../shared/components/tablecolumnsmanager/table-columns-manager';
import { CommentsService } from '../../todos/services/comments';


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, TableColumnsManagerComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Interface d'Administration</h1>
        <p class="text-gray-600 mt-2">Gérez les utilisateurs et les tickets</p>
      </div>

      <!-- Navigation Admin -->
      <div class="mb-8">
        <nav class="flex space-x-4">
          <button
            (click)="activeTab.set('users')"
            [class.bg-violet-400]="activeTab() === 'users'"
            [class.text-white]="activeTab() === 'users'"
            [class.text-gray-700]="activeTab() !== 'users'"
            class="px-4 py-2 rounded-md font-medium hover:bg-violet-700 hover:text-white transition-colors"
          >
            Utilisateurs
          </button>
          <button
            (click)="activeTab.set('tickets')"
            [class.bg-violet-400]="activeTab() === 'tickets'"
            [class.text-white]="activeTab() === 'tickets'"
            [class.text-gray-700]="activeTab() !== 'tickets'"
            class="px-4 py-2 rounded-md font-medium hover:bg-violet-700 hover:text-white transition-colors"
          >
            Tickets
          </button>
        </nav>
      </div>

      <!-- Contenu des onglets -->
      @if (activeTab() === 'users') {
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des Utilisateurs</h2>
              <app-table-columns-manager tableKey="users"></app-table-columns-manager>
          </div>
          <div class="p-6">
            @if (users().length > 0) {
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      @for (column of tableColumnsService.getVisibleColumns('users')(); track column.key) {
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {{ column.label }}
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    @for (user of users(); track user.id) {
                      <tr>
                        @for (column of tableColumnsService.getVisibleColumns('users')(); track column.key) {
                        <td class="px-6 py-4 whitespace-nowrap">
                          @switch (column.key) {
                            @case ('name') {
                          <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10">
                              <div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span class="text-sm font-medium text-gray-700">
                                  {{ user.name.charAt(0).toUpperCase() }}
                                </span>
                              </div>
                            </div>
                            <div class="ml-4">
                              <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                              <div class="text-sm text-gray-500">{{ user.email }}</div>
                            </div>
                          </div>
                          }
                          @case ('email') {
                            <div class="text-sm text-gray-900">{{ user.email }}</div>
                          }
                          @case ('role') {
                            <span
                              [class.bg-red-100]="user.role === 'admin'"
                              [class.text-red-800]="user.role === 'admin'"
                              [class.bg-green-100]="user.role === 'user'"
                              [class.text-green-800]="user.role === 'user'"
                              class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                            >
                              {{ user.role | titlecase }}
                            </span>
                          }
                          @case ('actions') {
                            <div class="text-sm font-medium">
                          @if (user.role !== 'admin') {
                            <button
                              (click)="deleteUser(user.id)"
                              class="text-red-600 hover:text-red-900"
                            >
                              Supprimer
                            </button>
                          } @else {
                            <span class="text-gray-400">Admin protégé</span>
                            }
                              </div>
                            }
                          }
                        </td>
                      }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <p class="text-gray-500 text-center py-8">Aucun utilisateur trouvé</p>
            }
          </div>
        </div>
      }

      @if (activeTab() === 'tickets') {
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-900">Gestion des Tickets</h2>
              <app-table-columns-manager tableKey="todos"></app-table-columns-manager>
          </div>
          <div class="p-6">
            @if (todos().length > 0) {
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      @for (column of tableColumnsService.getVisibleColumns('todos')(); track column.key) {
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {{ column.label }}
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    @for (todo of todos(); track todo.id) {
                      <tr>
                        @for (column of tableColumnsService.getVisibleColumns('todos')(); track column.key) {
                        <td class="px-6 py-4 whitespace-nowrap">
                          @switch (column.key) {
                            @case ('title') {
                              <div>
                                <div class="text-sm font-medium text-gray-900">{{ todo.title }}</div>
                              </div>
                            }
                            @case ('status') {
                          <span
                            [class.bg-yellow-100]="todo.status === 'todo'"
                            [class.text-yellow-800]="todo.status === 'todo'"
                            [class.bg-blue-100]="todo.status === 'in-progress'"
                            [class.text-blue-800]="todo.status === 'in-progress'"
                            [class.bg-green-100]="todo.status === 'done'"
                            [class.text-green-800]="todo.status === 'done'"
                            class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          >
                            {{ todo.status | titlecase }}
                          </span>
                          }
                          @case ('priority') {
                            <span
                              [class.bg-red-100]="todo.priority === 'high'"
                              [class.text-red-800]="todo.priority === 'high'"
                              [class.bg-yellow-100]="todo.priority === 'medium'"
                              [class.text-yellow-800]="todo.priority === 'medium'"
                              [class.bg-green-100]="todo.priority === 'low'"
                              [class.text-green-800]="todo.priority === 'low'"
                              class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                            >
                              {{ todo.priority | titlecase }}
                            </span>
                          }
                          @case ('assignedTo') {
                            <span class="text-sm text-gray-900">{{ todo.assignedTo || 'Non assigné' }}</span>
                          }
                          @case ('description') {
                            <div class="text-sm text-gray-500 max-w-xs truncate">
                              {{ todo.description || 'Aucune description' }}
                            </div>
                          }

                          @case ('comments') {
                            <div class="flex items-center gap-2">
                              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                              </svg>
                              <span class="text-sm text-gray-900">{{ commentsService.getCommentsCount(todo.id)() }}</span>
                              @if (commentsService.getCommentsCount(todo.id)() === 0) {
                                <span class="text-xs text-gray-400">Aucun</span>
                              }
                            </div>
                          }
                          @case ('actions') {
                            <div class="text-sm font-medium">
                            <button
                              (click)="deleteTodo(todo.id)"
                              class="text-red-600 hover:text-red-900 mr-3"
                            >
                              Supprimer
                            </button>

                            <select #userSelect class="rounded-lg border-gray-300 mr-3 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                              <option *ngFor="let user of users(); trackBy: trackByUserId" [value]="user.id">
                                {{ user.name }}
                              </option>
                            </select>

                            <button
                              (click)="assignTodo(todo, +userSelect.value)"
                              class="px-3 py-1 bg-violet-600 text-white text-sm font-medium rounded-lg shadow hover:bg-violet-700 transition"
                            >
                              Assigner
                            </button>
                          </div>
                        }
                      }
                    </td>
                    }
                    </tr>
                  }
                  </tbody>
                </table>
              </div>
            } @else {
              <p class="text-gray-500 text-center py-8">Aucun ticket trouvé</p>
            }
          </div>
        </div>
      }
    </div>
  `,
})

export class AdminComponent implements OnInit {
  private authService = inject(AuthService);
  private todoService = inject(TodoService);
  private router = inject(Router);
  private storage = inject(StorageService);
  protected tableColumnsService = inject(TableColumnsService);
  protected commentsService = inject(CommentsService);
  private notificationService = inject(NotificationService);

  // Writable signals for managing component state
  activeTab = signal<'users' | 'tickets'>('users');
  users = signal<User[]>([]);
  todos = signal<Todo[]>([]);

  // Additional writable signals for tracking system state
  public readonly isLoading = signal(false);
  public readonly lastUpdate = signal(new Date());
  public readonly actionCount = signal(0);

  // Computed signals for derived data and business logic
  public readonly hasAdminAccess = computed(() => {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.role === 'admin';
  });

  // Administrative statistics computed from current data
  public readonly adminStats = computed(() => ({
    totalUsers: this.users().length,
    totalTodos: this.todos().length,
    adminUsers: this.users().filter(u => u.role === 'admin').length,
    regularUsers: this.users().filter(u => u.role === 'user').length,
    completedTodos: this.todos().filter(t => t.status === 'done').length,
    pendingTodos: this.todos().filter(t => t.status === 'todo').length,
    inProgressTodos: this.todos().filter(t => t.status === 'in-progress').length,
    highPriorityTodos: this.todos().filter(t => t.priority === 'high').length
  }));

  // Current tab information with dynamic counts
  public readonly currentTabData = computed(() => {
    const tab = this.activeTab();
    const stats = this.adminStats();

    if (tab === 'users') {
      return {
        title: 'Utilisateurs',
        count: stats.totalUsers,
        details: `${stats.adminUsers} admin(s), ${stats.regularUsers} utilisateur(s)`
      };
    } else {
      return {
        title: 'Tickets',
        count: stats.totalTodos,
        details: `${stats.completedTodos} terminé(s), ${stats.pendingTodos} en attente`
      };
    }
  });

  // System health indicator based on high priority tickets ratio
  public readonly systemHealth = computed(() => {
    const stats = this.adminStats();
    const highPriorityRatio = stats.totalTodos > 0 ?
      (stats.highPriorityTodos / stats.totalTodos) * 100 : 0;

    if (highPriorityRatio > 50) {
      return { status: 'critical', color: 'text-red-600', message: 'Trop de tickets haute priorité' };
    } else if (highPriorityRatio > 25) {
      return { status: 'warning', color: 'text-yellow-600', message: 'Attention aux priorités' };
    } else {
      return { status: 'good', color: 'text-green-600', message: 'Système en bon état' };
    }
  });

  // Comprehensive dashboard summary combining all metrics
  public readonly dashboardSummary = computed(() => {
    const stats = this.adminStats();
    const actions = this.actionCount();
    const health = this.systemHealth();
    return {
      ...stats,
      actionsPerformed: actions,
      healthStatus: health.status,
      lastUpdate: this.lastUpdate()
    };
  });

  constructor() {
    // Load saved data from local storage
    const savedTodos = this.storage.get<Todo[]>('todos') ?? [];
    const savedUsers = this.storage.get<User[]>('users') ?? [];

    this.todos.set(savedTodos);
    this.users.set(savedUsers);

    // Initialize reactive effects
    this.setupEffects();
  }

  // Setup reactive effects for monitoring and logging
  private setupEffects() {
    // Effect : Log admin statistics on every change
    effect(() => {
      const stats = this.adminStats();
      console.warn(`Admin Dashboard: ${stats.totalUsers} users, ${stats.totalTodos} todos`);
    }, { allowSignalWrites: false });

    // Effect : Monitor system health and log critical states
    effect(() => {
      const health = this.systemHealth();
      if (health.status === 'critical') {
        console.warn('ADMIN ALERT: System in critical state -', health.message);
      }
    }, { allowSignalWrites: false });

    // Effect : Redirect unauthorized users
    effect(() => {
      if (!this.hasAdminAccess()) {
        console.warn('Admin access denied - redirecting to /todos');
        this.router.navigate(['/todos']);
      }
    }, { allowSignalWrites: false });

    // Effect : Update timestamp when data changes
    effect(() => {
      const users = this.users();
      const todos = this.todos();
      // Triggered when data changes
      if (users.length > 0 || todos.length > 0) {
        this.lastUpdate.set(new Date());
      }
    }, { allowSignalWrites: true });

    // Effect : Log tab navigation
    effect(() => {
      const tab = this.activeTab();
      const tabData = this.currentTabData();
      console.warn(`Admin tab switched to: ${tab} (${tabData.count} items)`);
    }, { allowSignalWrites: false });
  }

  private mergeUsers(mockUsers: User[], localUsers: User[]): User[] {
    const combined: Record<string, User> = {};

    // Ajouter les utilisateurs mock
    for (const u of mockUsers) {
      combined[u.email] = u;
    }

    // Ajouter les utilisateurs locaux, écrasant les doublons éventuels
    for (const u of localUsers) {
      combined[u.email] = u;
    }

    return Object.values(combined);
  }

  async ngOnInit() {
    // Verify user has admin privileges
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      this.router.navigate(['/todos']);
      return;
    }

    // Load initial data
    await this.loadUsers();
    await this.loadTodos();
  }

  async loadUsers() {
    try {
      this.isLoading.set(true);
      const users = this.authService.getAllUsers()();
      this.users.set(users);
      console.warn('Users loaded:', users.length);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadTodos() {
    try {
      this.isLoading.set(true);
      const todos = await this.todoService.getAllTodos();
      this.todos.set(todos);
      console.warn('Todos loaded:', todos.length);
    } catch (error) {
      console.error('Erreur lors du chargement des todos:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteUser(userId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        this.actionCount.update(count => count + 1);
        const userToDelete = this.users().find(u => u.id === userId);
        await this.authService.deleteUser(userId);
        const localUsers = this.storage.get<User[]>('users') ?? [];
        const updatedLocalUsers = localUsers.filter(u => u.id !== userId);
        this.storage.set('users', updatedLocalUsers);
        await this.loadUsers();
        const userName = userToDelete?.name || 'Utilisateur';
        this.notificationService.success(`${userName} supprimé avec succès`);
        console.warn('User deleted:', userId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  }

  async deleteTodo(todoId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) {
      try {
        this.actionCount.update(count => count + 1);
        const todoToDelete = this.todos().find(t => t.id === todoId);
        await this.todoService.deleteTodo(todoId);
        await this.loadTodos();
        const todoTitle = todoToDelete?.title || 'Ticket';
        this.notificationService.success(`Ticket "${todoTitle}" supprimé`);
        console.warn('Todo deleted:', todoId);
      } catch (error) {
        this.notificationService.error('Erreur lors de la suppression du ticket');
        console.error('Erreur lors de la suppression:', error);
      }
    }
  }

  async assignTodo(todo: Todo, userId: number) {
    try {
      this.actionCount.update(count => count + 1);
      const updated = await this.todoService.updateTodo(todo.id, { assignedTo: userId });
      if (updated) {
        console.warn(`Tâche "${updated.title}" assignée à ${userId}`);
        // Refresh the list
        this.todos.set(await this.todoService.getAllTodos());
      }
    } catch (err) {
      console.error('Erreur assignation', err);
    }
    this.storage.set('todos', this.todos());
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }

  trackByTodoId(index: number, todo: Todo): number {
    return todo.id;
  }
}