import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TodoService } from './todo';
import { Todo } from '../models/todo';
import { MockApiService } from '../../../infrastructure/mock-data/mock-api.service';
import { StorageService } from '../../storage/services/localStorage';
import { NotificationService } from '../../../shared/service/notifications-service';
import { AuthService } from '../../auth/services/auth';
import { signal, computed } from '@angular/core';

describe('TodoService', () => {
  let service: TodoService;
  let mockApiService: jasmine.SpyObj<MockApiService>;
  let storageService: jasmine.SpyObj<StorageService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let authService: jasmine.SpyObj<AuthService>;

  // Inclure des todos avec deadlines dès le départ
  const mockTodosWithVariety: Todo[] = [
    {
      id: 1,
      title: 'Mock Todo 1',
      description: 'Description 1',
      status: 'todo',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 1,
    },
    {
      id: 2,
      title: 'Mock Todo 2',
      description: 'Description 2',
      status: 'done',
      priority: 'high',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 1,
      deadline: new Date('2024-12-31') // Future deadline
    },
    {
      id: 3,
      title: 'Mock Todo 3',
      description: 'Description 3',
      status: 'in-progress',
      priority: 'low',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 1,
    },
    {
      id: 4,
      title: 'Overdue Todo',
      description: 'This is overdue',
      status: 'todo',
      priority: 'high',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 1,
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday (overdue)
    }
  ];

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'user' as const
  };

  beforeEach(async () => {
    // Create signals for MockApiService
    const todosSignal = signal(mockTodosWithVariety);
    const loadingSignal = signal(false);
    const errorSignal = signal<string | null>(null);
    const apiStatsSignal = signal({
      totalRequests: 0,
      failureMode: false,
      todosCount: mockTodosWithVariety.length,
      usersCount: 3,
      hasError: false,
      isHealthy: true
    });

    const mockApiSpy = jasmine.createSpyObj('MockApiService', [
      'getTodos',
      'createTodo',
      'updateTodo',
      'deleteTodo',
      'clearError',
      'toggleFailureMode'
    ], {
      todos: computed(() => todosSignal()),
      loading: computed(() => loadingSignal()),
      error: computed(() => errorSignal()),
      apiStats: computed(() => apiStatsSignal())
    });

    const storageSpy = jasmine.createSpyObj('StorageService', ['get', 'set']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    // Setup return values
    mockApiSpy.getTodos.and.returnValue(Promise.resolve(mockTodosWithVariety));
    mockApiSpy.createTodo.and.returnValue(Promise.resolve(mockTodosWithVariety[0]));
    mockApiSpy.updateTodo.and.returnValue(Promise.resolve(mockTodosWithVariety[0]));
    mockApiSpy.deleteTodo.and.returnValue(Promise.resolve(true));
    storageSpy.get.and.returnValue(mockTodosWithVariety);
    authSpy.getCurrentUser.and.returnValue(mockUser);

    await TestBed.configureTestingModule({
      providers: [
        TodoService,
        { provide: MockApiService, useValue: mockApiSpy },
        { provide: storageService, useValue: storageSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    });

    service = TestBed.inject(TodoService);
    mockApiService = TestBed.inject(MockApiService) as jasmine.SpyObj<MockApiService>;
    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with mock data from API', fakeAsync(() => {
    tick(100); // Allow initial data load
    expect(service.todos().length).toBe(4); // Updated count
  }));

  it('should compute todoStats correctly', fakeAsync(() => {
    tick(100); // Allow initial data load

    const stats = service.todoStats();
    expect(stats.total).toBe(4); // Updated count
    expect(stats.completed).toBe(1);
    expect(stats.pending).toBe(2); // Updated count (2 todos with status 'todo')
    expect(stats.inProgress).toBe(1);
    expect(stats.highPriority).toBe(2); // Updated count (2 high priority todos)
    expect(stats.completionRate).toBeCloseTo(25, 2); // 1/4 = 25%
  }));

  it('should get all todos', async () => {
    const result = await service.getAllTodos();

    expect(result).toEqual(mockTodosWithVariety);
    expect(mockApiService.getTodos).toHaveBeenCalled();
  });

  it('should create todo correctly', async () => {
    const newTodoData = {
      title: 'Test Todo',
      description: 'Test Description',
      status: 'todo' as const,
      priority: 'medium' as const
    };

    const expectedTodo = {
      ...newTodoData,
      id: 5,
      createdBy: mockUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockApiService.createTodo.and.returnValue(Promise.resolve(expectedTodo));

    const result = await service.createTodo(newTodoData);

    expect(result).toEqual(expectedTodo);
    expect(mockApiService.createTodo).toHaveBeenCalledWith({
      ...newTodoData,
      createdBy: mockUser.id
    });
    expect(notificationService.success).toHaveBeenCalledWith('Tâche "Test Todo" créée avec succès');
  });

  it('should throw error when creating todo without authenticated user', async () => {
    authService.getCurrentUser.and.returnValue(null);

    try {
      await service.createTodo({ title: 'Test' });
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toEqual(new Error('Aucun utilisateur connecté'));
    }
  });

  it('should update todo correctly', async () => {
    const updates = { title: 'Updated Title', status: 'done' as const };
    const updatedTodo = { ...mockTodosWithVariety[0], ...updates };

    mockApiService.updateTodo.and.returnValue(Promise.resolve(updatedTodo));

    const result = await service.updateTodo(1, updates);

    expect(result).toEqual(updatedTodo);
    expect(mockApiService.updateTodo).toHaveBeenCalledWith(1, updates);
  });

  it('should delete todo correctly', async () => {
    const result = await service.deleteTodo(1);

    expect(result).toBe(true);
    expect(mockApiService.deleteTodo).toHaveBeenCalledWith(1);
    expect(notificationService.success).toHaveBeenCalledWith('Tâche supprimée');
  });

  it('should update deadline correctly', async () => {
    const deadline = new Date('2024-12-31');
    const updatedTodo = { ...mockTodosWithVariety[0], deadline };

    mockApiService.updateTodo.and.returnValue(Promise.resolve(updatedTodo));

    const result = await service.updateDeadline(1, deadline);

    expect(result).toEqual(updatedTodo);
    expect(mockApiService.updateTodo).toHaveBeenCalledWith(1, { deadline });
    expect(notificationService.success).toHaveBeenCalledWith('Échéance mise à jour avec succès');
  });

  it('should clear deadline correctly', async () => {
    const updatedTodo = { ...mockTodosWithVariety[0], deadline: undefined };

    mockApiService.updateTodo.and.returnValue(Promise.resolve(updatedTodo));

    const result = await service.updateDeadline(1, null);

    expect(result).toEqual(updatedTodo);
    expect(mockApiService.updateTodo).toHaveBeenCalledWith(1, { deadline: undefined });
  });

  it('should compute completed todos correctly', fakeAsync(() => {
    tick(100); // Allow initial data load

    const completedTodos = service.completedTodos();
    expect(completedTodos.length).toBe(1);
    expect(completedTodos[0].status).toBe('done');
  }));

  it('should compute pending todos correctly', fakeAsync(() => {
    tick(100);

    const pendingTodos = service.pendingTodos();
    expect(pendingTodos.length).toBe(2); // Updated count
    expect(pendingTodos.every(todo => todo.status === 'todo')).toBe(true);
  }));

  it('should compute in-progress todos correctly', fakeAsync(() => {
    tick(100);

    const inProgressTodos = service.inProgressTodos();
    expect(inProgressTodos.length).toBe(1);
    expect(inProgressTodos[0].status).toBe('in-progress');
  }));

  it('should compute todos with deadlines correctly', fakeAsync(() => {
    tick(100);

    const todosWithDeadlines = service.todosWithDeadlines();
    expect(todosWithDeadlines.length).toBe(2); // 2 todos have deadlines
    expect(todosWithDeadlines.every(todo => todo.deadline)).toBe(true);
  }));

  it('should compute overdue todos correctly', fakeAsync(() => {
    tick(100);

    const overdueTodos = service.overdueTodos();
    expect(overdueTodos.length).toBe(1); // 1 overdue todo
    expect(overdueTodos[0].deadline).toBeDefined();
    expect(new Date() > new Date(overdueTodos[0].deadline!)).toBe(true);
  }));

  it('should handle errors in createTodo', async () => {
    mockApiService.createTodo.and.returnValue(Promise.reject(new Error('API Error')));

    try {
      await service.createTodo({ title: 'Test' });
      fail('Should have thrown an error');
    } catch (error) {
      console.error(error);
      expect(notificationService.error).toHaveBeenCalledWith('Erreur lors de la création de la tâche');
    }
  });

  it('should handle errors in updateTodo', async () => {
    mockApiService.updateTodo.and.returnValue(Promise.reject(new Error('API Error')));

    try {
      await service.updateTodo(1, { title: 'Updated' });
      fail('Should have thrown an error');
    } catch (error) {
      console.error(error);
      expect(notificationService.error).toHaveBeenCalledWith('Erreur lors de la mise à jour');
    }
  });

  it('should handle errors in deleteTodo', async () => {
    mockApiService.deleteTodo.and.returnValue(Promise.reject(new Error('API Error')));

    try {
      await service.deleteTodo(1);
      fail('Should have thrown an error');
    } catch (error) {
      console.error(error);
      expect(notificationService.error).toHaveBeenCalledWith('Erreur lors de la suppression');
    }
  });

  it('should provide access to Mock API signals', () => {
    // Ces tests dépendent de l'implémentation réelle du service
    // Ajustez selon les méthodes disponibles
    expect(service.todos).toBeDefined();
    expect(service.loading).toBeDefined();
    expect(service.error).toBeDefined();
  });

  it('should toggle API failure mode', () => {
    service.toggleApiFailure();
    expect(mockApiService.toggleFailureMode).toHaveBeenCalled();
  });

  it('should clear errors', () => {
    service.clearError();
    expect(mockApiService.clearError).toHaveBeenCalled();
  });

  it('should handle error in getAllTodos', async () => {
    mockApiService.getTodos.and.returnValue(Promise.reject(new Error('Network error')));

    try {
      await service.getAllTodos();
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toEqual(new Error('Network error'));
    }
  });

it('should fallback to localStorage on initial load error', fakeAsync(() => {
    // Recréer complètement le TestBed pour simuler l'initialisation avec erreur API
    TestBed.resetTestingModule();

    // Préparer les mocks avec erreur API
    const todosSignal = signal(mockTodosWithVariety);
    const loadingSignal = signal(false);
    const errorSignal = signal<string | null>(null);
    const apiStatsSignal = signal({
        totalRequests: 0,
        failureMode: false,
        todosCount: mockTodosWithVariety.length,
        usersCount: 3,
        hasError: false,
        isHealthy: true
    });

    const failingMockApiSpy = jasmine.createSpyObj('MockApiService', [
        'getTodos',
        'createTodo',
        'updateTodo',
        'deleteTodo',
        'clearError',
        'toggleFailureMode'
    ], {
        todos: computed(() => todosSignal()),
        loading: computed(() => loadingSignal()),
        error: computed(() => errorSignal()),
        apiStats: computed(() => apiStatsSignal())
    });

    const storageSpy = jasmine.createSpyObj('StorageService', ['get', 'set']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    // Configurer l'API pour échouer
    failingMockApiSpy.getTodos.and.returnValue(Promise.reject(new Error('API Error')));
    storageSpy.get.and.returnValue(mockTodosWithVariety);
    authSpy.getCurrentUser.and.returnValue(mockUser);

    TestBed.configureTestingModule({
        providers: [
            TodoService,
            { provide: MockApiService, useValue: failingMockApiSpy },
            { provide: StorageService, useValue: storageSpy },
            { provide: NotificationService, useValue: notificationSpy },
            { provide: AuthService, useValue: authSpy }
        ]
    });

    // Créer une nouvelle instance du service et vérifier le comportement
    TestBed.inject(TodoService);
    const newStorageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;

    tick(100); // Allow async operations

    // Vérifier que le localStorage a été appelé lors de l'initialisation
    expect(newStorageService.get).toHaveBeenCalledWith('todos');
}));
});