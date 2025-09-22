import { TestBed } from '@angular/core/testing';
import { TodoService } from './todo.service';
import { Todo } from '../models/todo.model';

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TodoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with 3 mock todos', () => {
    expect(service.getTodos().length).toBe(3);
  });

  it('should add todo correctly', () => {
    const todo: Todo = {
      id: 1,
      title: 'Test Todo',
      description: 'Test Description',
      status: 'todo',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 0,
    };

    service.addTodo(todo);
    expect(service.getTodos().length).toBe(4);
    expect(service.getTodos()[3]).toEqual(todo);
  });

  it('should compute completed todos correctly', () => {
    const todo1: Todo = {
      id: 1,
      title: 'Todo 1',
      status: 'done',
      priority: 'low',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: '',
      createdBy: 0,
    };
    const todo2: Todo = {
      id: 2,
      title: 'Todo 2',
      status: 'todo',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: '',
      createdBy: 0,
    };

    service.addTodo(todo1);
    service.addTodo(todo2);

    expect(service.completedTodos().length).toBe(2);
    expect(service.completedTodos()[0].id).toBe(3);
  });

  it('should compute pending todos correctly', () => {
    const todo1: Todo = {
      id: 1,
      title: 'Todo 1',
      status: 'todo',
      priority: 'low',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: '',
      createdBy: 0,
    };
    const todo2: Todo = {
      id: 2,
      title: 'Todo 2',
      status: 'in-progress',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: '',
      createdBy: 0,
    };

    service.addTodo(todo1);
    service.addTodo(todo2);

    expect(service.inProgressTodos().length).toBe(2);
    expect(service.pendingTodos()[0].id).toBe(1);
  });

  it('should compute in-progress todos correctly', () => {
    const todo1: Todo = {
      id: 1,
      title: 'Todo 1',
      status: 'todo',
      priority: 'low',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: '',
      createdBy: 0,
    };
    const todo2: Todo = {
      id: 2,
      title: 'Todo 2',
      status: 'in-progress',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: '',
      createdBy: 0,
    };

    service.addTodo(todo1);
    service.addTodo(todo2);

    expect(service.inProgressTodos().length).toBe(2);
    expect(service.inProgressTodos()[0].id).toBe(2);
  });

  it('should compute stats correctly', () => {
    const todo1: Todo = {
      id: 1,
      title: 'Todo 1',
      status: 'done',
      priority: 'high',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: '',
      createdBy: 0,
    };
    const todo2: Todo = {
      id: 2,
      title: 'Todo 2',
      status: 'todo',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: '',
      createdBy: 0,
    };
    const todo3: Todo = {
      id: 3,
      title: 'Todo 3',
      status: 'in-progress',
      priority: 'high',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: '',
      createdBy: 0,
    };

    service.addTodo(todo1);
    service.addTodo(todo2);
    service.addTodo(todo3);

    const stats = service.todoStats();
    expect(stats.total).toBe(6);
    expect(stats.completed).toBe(2);
    expect(stats.pending).toBe(2);
    expect(stats.inProgress).toBe(2);
    expect(stats.highPriority).toBe(4);
    expect(stats.completionRate).toBe(33.33333333333333);
  });
});
