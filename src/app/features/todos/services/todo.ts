import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Todo } from '../models/todo';
import { StorageService } from '../../storage/services/localStorage';
import { MockApiService } from '../../../infrastructure/mock-data/mock-api.service';
import { AuthService } from '../../auth/services/auth';
import { NotificationService } from '../../../shared/service/notifications-service';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private storage = inject(StorageService);
  private mockApi = inject(MockApiService); // Inject Mock API service
  private auth = inject(AuthService);
  private notificationService = inject(NotificationService);

  // Writable signals for internal state management
  private readonly _todos = signal<Todo[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Read-only computed signals for external consumption
  public readonly todos = computed(() => this._todos());
  public readonly loading = computed(() => this._isLoading() || this.mockApi.loading());
  public readonly error = computed(() => this._error() || this.mockApi.error());

  // Computed signal for todo statistics
  public readonly todoStats = computed(() => {
    const todos = this._todos();
    const total = todos.length;
    const completed = todos.filter(t => t.status === 'done').length;
    const pending = todos.filter(t => t.status === 'todo').length;
    const inProgress = todos.filter(t => t.status === 'in-progress').length;
    const highPriority = todos.filter(t => t.priority === 'high').length;

    return {
      total,
      completed,
      pending,
      inProgress,
      highPriority,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  });

  constructor() {
    this.setupEffects();
    this.loadInitialData();
  }

  // Setup reactive effects for data synchronization
  private setupEffects() {
    // Effect: Synchronize with Mock API data
    effect(() => {
      const mockTodos = this.mockApi.todos();
      if (mockTodos.length > 0) {
        this._todos.set(mockTodos);
        this.storage.set('todos', mockTodos);
      }
    }, { allowSignalWrites: true });

    // Effect: Log statistics changes for debugging
    effect(() => {
      const stats = this.todoStats();
      console.warn(`Todo Stats: ${stats.total} total, ${stats.completed} completed, ${stats.completionRate} completed`);
    }, { allowSignalWrites: false });
  }

  // Load initial data from Mock API with localStorage fallback
  private async loadInitialData() {
    try {
      this._isLoading.set(true);

      // Load from Mock API
      const todos = await this.mockApi.getTodos();
      this._todos.set(todos);

      // Backup to localStorage
      // this.saveTodos(todos);

    } catch (error: unknown) {
      console.error('Error loading todos:', error);
      this._error.set(error instanceof Error ? error.message : 'An unknown error occurred');

      // Fallback to localStorage
      const savedTodos = this.storage.get<Todo[]>('todos') ?? [];
      this._todos.set(savedTodos);

    } finally {
      this._isLoading.set(false);
    }
  }

  // API methods with Mock API integration
  async getAllTodos(): Promise<Todo[]> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const todos = await this.mockApi.getTodos();
      this._todos.set(todos);

      return todos;
    } catch (error: unknown) {
      this._error.set(error instanceof Error ? error.message : 'An unknown error occurred');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  // Create a new todo via Mock API
  async createTodo(todoData: Partial<Todo>): Promise<Todo> {
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const newTodo = await this.mockApi.createTodo({
        ...todoData,
        createdBy: currentUser.id,
      });

      // Todos are automatically updated via effect
      this.notificationService.success(`Tâche "${newTodo.title}" créée avec succès`);
      return newTodo;

    } catch (error) {
      this.notificationService.error('Erreur lors de la création de la tâche');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  // Update an existing todo via Mock API
  async updateTodo(id: number, updates: Partial<Todo>): Promise<Todo | null> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const updatedTodo = await this.mockApi.updateTodo(id, updates);

      return updatedTodo;

    } catch (error) {
      this.notificationService.error('Erreur lors de la mise à jour');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  // Delete a todo via Mock API
  async deleteTodo(id: number): Promise<boolean> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const success = await this.mockApi.deleteTodo(id);
      this.notificationService.success('Tâche supprimée');
      return success;

    } catch (error) {
      this.notificationService.error('Erreur lors de la suppression');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  public readonly completedTodos = computed(() =>
    this._todos().filter(todo => todo.status === 'done')
  );

  public readonly pendingTodos = computed(() =>
    this._todos().filter(todo => todo.status === 'todo')
  );

  public readonly inProgressTodos = computed(() =>
    this._todos().filter(todo => todo.status === 'in-progress')
  );

  // Direct access to Mock API signals
  getTodosSignal() {
    return this.mockApi.todos;
  }

  // Get combined loading state
  getLoadingState() {
    return this.loading;
  }

  // Get API statistics from Mock API
  getApiStats() {
    return this.mockApi.apiStats;
  }

  // Testing and debugging methods
  toggleApiFailure() {
    this.mockApi.toggleFailureMode();
  }

  // Clear all error states
  clearError() {
    this._error.set(null);
    this.mockApi.clearError();
  }
}