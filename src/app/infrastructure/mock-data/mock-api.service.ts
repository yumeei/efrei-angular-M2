import { Injectable, signal, computed, effect } from '@angular/core';
import { Todo } from '../../features/todos/models/todo';
import { User } from '../../features/auth/models/user';

@Injectable({
    providedIn: 'root'
})
export class MockApiService {
    // Writable signals for API state management
    private readonly requestCount = signal(0);
    private readonly shouldFail = signal(false);
    private readonly isLoading = signal(false);
    private readonly lastError = signal<string | null>(null);

    // Mock data stored in signals
    private readonly mockTodos = signal<Todo[]>([
        {
            id: 1,
            title: 'Implémenter HTTP intercepteur',
            status: 'in-progress',
            priority: 'high',
            assignedTo: 1,
            description: '',
            createdBy: 0,
            createdAt: new Date('2024-01-13'),
            updatedAt: new Date('2024-01-14'),
        },
        {
            id: 2,
            title: 'Créer service gestion erreurs',
            status: 'done',
            priority: 'medium',
            assignedTo: 2,
            description: '',
            createdBy: 0,
            createdAt: new Date('2024-01-13'),
            updatedAt: new Date('2024-01-14'),
        },
        {
            id: 3,
            title: 'Tester simulation API avec signals',
            status: 'todo',
            priority: 'low',
            assignedTo: 1,
            description: '',
            createdBy: 0,
            createdAt: new Date('2024-01-13'),
            updatedAt: new Date('2024-01-14'),
        }
    ]);

    private readonly mockUsers = signal<User[]>([
        {
            id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin',
            password: 'admin123'
        },
        {
            id: 2, name: 'Regular User', email: 'user@example.com', role: 'user',
            password: 'user123'
        },
        {
            id: 3, name: 'Test User', email: 'test@test.test', role: 'user',
            password: 'testtest'
        }
    ]);

    // Read-only computed signals for public API
    public readonly todos = computed(() => this.mockTodos());
    public readonly users = computed(() => this.mockUsers());
    public readonly loading = computed(() => this.isLoading());
    public readonly error = computed(() => this.lastError());

    // Computed signal for API statistics
    public readonly apiStats = computed(() => ({
        totalRequests: this.requestCount(),
        failureMode: this.shouldFail(),
        todosCount: this.mockTodos().length,
        usersCount: this.mockUsers().length,
        hasError: !!this.lastError(),
        isHealthy: this.requestCount() > 0 && !this.shouldFail()
    }));

    // Computed signal for todos grouped by status
    public readonly todosByStatus = computed(() => {
        const todos = this.mockTodos();
        return {
            todo: todos.filter(t => t.status === 'todo').length,
            inProgress: todos.filter(t => t.status === 'in-progress').length,
            done: todos.filter(t => t.status === 'done').length
        };
    });

    // Computed signal for high priority todos
    public readonly highPriorityTodos = computed(() =>
        this.mockTodos().filter(t => t.priority === 'high')
    );

    constructor() {
        this.setupEffects();
    }

    // Setup reactive effects for monitoring and logging
    private setupEffects() {
        // Effect: Log API usage statistics every 5 requests
        effect(() => {
            const stats = this.apiStats();
            if (stats.totalRequests > 0 && stats.totalRequests % 5 === 0) {
                console.warn(`Mock API Stats: ${stats.totalRequests} requests, ${stats.todosCount} todos`);
            }
        }, { allowSignalWrites: false });

        // Effect: Monitor and log API errors
        effect(() => {
            const error = this.lastError();
            if (error) {
                console.error(`Mock API Error: ${error}`);
            }
        }, { allowSignalWrites: false });

        // Effect: Monitor high priority todos count
        effect(() => {
            const highPriority = this.highPriorityTodos();
            if (highPriority.length > 3) {
                console.warn(`Too many high priority todos: ${highPriority.length}`);
            }
        }, { allowSignalWrites: false });
    }

    // Asynchronous API methods with signal-based state management

    async getTodos(): Promise<Todo[]> {
        return this.simulateAsyncCall(() => {
            return this.mockTodos();
        }, 'GET /todos');
    }

    async getUsers(): Promise<User[]> {
        return this.simulateAsyncCall(() => {
            return this.mockUsers();
        }, 'GET /users');
    }

    async getTodoById(id: number): Promise<Todo | null> {
        return this.simulateAsyncCall(() => {
            return this.mockTodos().find(t => t.id === id) || null;
        }, `GET /todos/${id}`);
    }

    async createTodo(todoData: Partial<Todo>): Promise<Todo> {
        return this.simulateAsyncCall(() => {
            const newTodo: Todo = {
                id: Date.now(),
                title: todoData.title || '',
                status: todoData.status || 'todo',
                priority: todoData.priority || 'medium',
                assignedTo: todoData.assignedTo,
                description: '',
                createdBy: 0,
                createdAt: new Date('2024-01-13'),
                updatedAt: new Date('2024-01-14'),
            };

            // Update todos signal with new todo
            this.mockTodos.update(todos => [...todos, newTodo]);

            return newTodo;
        }, 'POST /todos', 2500);
    }

    async updateTodo(id: number, updates: Partial<Todo>): Promise<Todo | null> {
        return this.simulateAsyncCall(() => {
            // Update the specific todo in the signal
            this.mockTodos.update(todos =>
                todos.map(todo =>
                    todo.id === id ? { ...todo, ...updates } : todo
                )
            );

            return this.mockTodos().find(t => t.id === id) || null;
        }, `PUT /todos/${id}`, 2000);
    }

    async deleteTodo(id: number): Promise<boolean> {
        return this.simulateAsyncCall(() => {
            const initialLength = this.mockTodos().length;

            // Remove todo from signal
            this.mockTodos.update(todos => todos.filter(t => t.id !== id));

            return this.mockTodos().length < initialLength;
        }, `DELETE /todos/${id}`, 1000);
    }

    async createUser(userData: Partial<User>): Promise<User> {
        return this.simulateAsyncCall(() => {
            const newUser: User = {
                id: Date.now(),
                name: userData.name || '',
                email: userData.email || '',
                role: userData.role || 'user',
                password: ''
            };

            // Add new user to signal
            this.mockUsers.update(users => [...users, newUser]);

            return newUser;
        }, 'POST /users', 2000);
    }

    async deleteUser(id: number): Promise<boolean> {
        return this.simulateAsyncCall(() => {
            const initialLength = this.mockUsers().length;

            // Remove user from signal
            this.mockUsers.update(users => users.filter(u => u.id !== id));

            return this.mockUsers().length < initialLength;
        }, `DELETE /users/${id}`, 1500);
    }

    // Helper method to simulate async API calls with delay and error handling
    private async simulateAsyncCall<T>(
        operation: () => T,
        endpoint: string,
        delay = 1500
    ): Promise<T> {
        // Update request tracking signals
        this.requestCount.update(count => count + 1);
        this.isLoading.set(true);
        this.lastError.set(null);

        console.warn(`Mock API Call: ${endpoint}`);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            // Check if API should simulate failure
            if (this.shouldFail()) {
                throw new Error(`Erreur simulée pour ${endpoint}`);
            }

            // Execute the operation
            const result = operation();
            console.warn(`Mock API Success: ${endpoint}`);

            return result;

        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'Erreur inconnue';
            this.lastError.set(errorMessage);
            console.error(`Mock API Error: ${endpoint} - ${errorMessage}`);
            throw error;
        } finally {
            this.isLoading.set(false);
        }
    }

    // Control methods for testing and debugging
    toggleFailureMode(): void {
        this.shouldFail.update(fail => !fail);
        console.warn(`Failure mode: ${this.shouldFail() ? 'ON' : 'OFF'}`);
    }

    clearError(): void {
        this.lastError.set(null);
    }

    // Reset mock data to initial state
    resetData(): void {
        this.mockTodos.set([
            {
                id: 1, title: 'Todo initial', status: 'todo', priority: 'medium', assignedTo: 1,
                description: '',
                createdBy: 0,
                createdAt: new Date('2024-01-13'),
                updatedAt: new Date('2024-01-14'),
            }
        ]);
        this.mockUsers.set([
            {
                id: 1, name: 'User initial', email: 'user@test.com', role: 'user',
                password: ''
            }
        ]);
        console.warn('Mock data reset');
    }

    // Reset API statistics
    resetStats(): void {
        this.requestCount.set(0);
        this.lastError.set(null);
        console.warn('Mock API stats reset');
    }

    // Getter methods for direct signal access
    getApiHealth() {
        return this.apiStats();
    }

    getCurrentTodos() {
        return this.todos();
    }

    getCurrentUsers() {
        return this.users();
    }
}