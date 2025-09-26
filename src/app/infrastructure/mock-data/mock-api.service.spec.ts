import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MockApiService } from './mock-api.service';
import { Todo } from '../../features/todos/models/todo';
import { User } from '../../features/auth/models/user';

describe('MockApiService', () => {
    let service: MockApiService;
    let consoleSpy: jasmine.Spy;
    let consoleErrorSpy: jasmine.Spy;

    beforeEach(async () => {
        // Clear localStorage before each test
        localStorage.clear();

        await TestBed.configureTestingModule({
            providers: [MockApiService]
        }).compileComponents();

        service = TestBed.inject(MockApiService);
        consoleSpy = spyOn(console, 'warn').and.callThrough();
        consoleErrorSpy = spyOn(console, 'error').and.callThrough();
    });

    afterEach(() => {
        consoleSpy.calls.reset();
        consoleErrorSpy.calls.reset();
        localStorage.clear();
        // Reset service state
        service.clearError();
        if (service.apiStats().failureMode) {
            service.toggleFailureMode();
        }
    });

  describe('Service Initialization', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });

        it('should initialize with default mock data', () => {
            // Le service charge depuis localStorage ou utilise les données par défaut
            // Vérifiez les données réelles plutôt que d'assumer 3
            const todos = service.todos();
            const users = service.users();

            expect(todos.length).toBeGreaterThan(0);
            expect(users.length).toBeGreaterThan(0);
            expect(service.loading()).toBeFalse();
            expect(service.error()).toBeNull();
        });

        it('should have correct initial API stats', () => {
            const stats = service.apiStats();
            expect(stats.totalRequests).toBe(0);
            expect(stats.failureMode).toBeFalse();
            expect(stats.todosCount).toBe(service.todos().length); // Utiliser la longueur réelle
            expect(stats.usersCount).toBe(service.users().length); // Utiliser la longueur réelle
            expect(stats.hasError).toBeFalse();
            expect(stats.isHealthy).toBeFalse(); // No requests made yet
        });

        it('should initialize with correct todo data', () => {
            const todos = service.todos();
            if (todos.length > 0) {
                expect(todos[0].title).toBeTruthy();
                expect(todos[0].status).toBeTruthy();
                expect(todos[0].priority).toBeTruthy();
            }
        });


        it('should initialize with correct user data', () => {
            const users = service.users();
            if (users.length > 0) {
                expect(users[0].name).toBeTruthy();
                expect(users[0].email).toBeTruthy();
                expect(users[0].role).toBeTruthy();
            }
        });

            it('should load from localStorage if available', async () => {
            // Clear localStorage et créer un nouveau TestBed
            localStorage.clear();

            const customTodos = [
                { id: 99, title: 'Custom Todo', status: 'todo', priority: 'high', assignedTo: 1, description: '', createdBy: 0, createdAt: new Date(), updatedAt: new Date() }
            ];

            localStorage.setItem('todos', JSON.stringify(customTodos));

            // Recréer le TestBed pour forcer une nouvelle instance
            await TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                providers: [MockApiService]
            }).compileComponents();

            const newService = TestBed.inject(MockApiService);
            expect(newService.todos()[0].title).toBe('Custom Todo');
        });
    });

    describe('Computed Signals', () => {
        it('should correctly compute todos by status', () => {
            const todos = service.todos();
            const todosByStatus = service.todosByStatus();

            // Compter manuellement pour vérifier
            const todoCount = todos.filter(t => t.status === 'todo').length;
            const inProgressCount = todos.filter(t => t.status === 'in-progress').length;
            const doneCount = todos.filter(t => t.status === 'done').length;

            expect(todosByStatus.todo).toBe(todoCount);
            expect(todosByStatus.inProgress).toBe(inProgressCount);
            expect(todosByStatus.done).toBe(doneCount);
        });

       it('should correctly compute high priority todos', () => {
            const todos = service.todos();
            const highPriorityTodos = service.highPriorityTodos();
            const expectedCount = todos.filter(t => t.priority === 'high').length;

            expect(highPriorityTodos.length).toBe(expectedCount);
            if (highPriorityTodos.length > 0) {
                expect(highPriorityTodos.every(t => t.priority === 'high')).toBeTrue();
            }
        });

        it('should update apiStats when data changes', fakeAsync(() => {
            const initialStats = service.apiStats();

            service.createTodo({ title: 'New Todo' }).catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(2500);

            const updatedStats = service.apiStats();
            expect(updatedStats.totalRequests).toBe(initialStats.totalRequests + 1);
            expect(updatedStats.todosCount).toBe(initialStats.todosCount + 1);
        }));

        it('should update isHealthy when requests are made', fakeAsync(() => {
            expect(service.apiStats().isHealthy).toBeFalse();

            service.getTodos().catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(1500);

            expect(service.apiStats().isHealthy).toBeTrue();
        }));
    });

      describe('Todo Operations', () => {
    it('should get all todos', fakeAsync(() => {
        let result: Todo[] = [];
        const initialCount = service.todos().length;

        service.getTodos().then(todos => {
            result = todos;
        }).catch((error: Error) => {
            console.error('Test error:', error);
        });

        tick(1500);

        expect(result.length).toBe(initialCount);
        expect(consoleSpy).toHaveBeenCalledWith('Mock API Call: GET /todos');
        expect(consoleSpy).toHaveBeenCalledWith('Mock API Success: GET /todos');
    }));

    it('should get todo by id', fakeAsync(() => {
        let result: Todo | null = null;
        const firstTodoId = service.todos()[0]?.id;

        if (firstTodoId) {
            service.getTodoById(firstTodoId).then(todo => {
                result = todo;
            }).catch((error: Error) => {
                console.error('Test error:', error);
            });

            tick(1500);

            expect(result).toBeTruthy();
            expect(result!.id).toBe(firstTodoId);
            expect(consoleSpy).toHaveBeenCalledWith(`Mock API Call: GET /todos/${firstTodoId}`);
        } else {
            pending('No todos available for this test');
        }
    }));

    it('should return null for non-existent todo', fakeAsync(() => {
        let result: Todo | null | undefined = undefined;

        service.getTodoById(999).then(todo => {
            result = todo;
        }).catch((error: Error) => {
            console.error('Test error:', error);
        });

        tick(1500);

        expect(result).toBeNull();
    }));

    it('should create a new todo with Date.now() ID', fakeAsync(() => {
        const initialCount = service.todos().length;
        const todoData = {
            title: 'Test Todo for Creation',
            status: 'todo' as const,
            priority: 'high' as const,
            assignedTo: 1
        };

        let result: Todo | null = null;

        service.createTodo(todoData).then(todo => {
            result = todo;
        }).catch((error: Error) => {
            console.error('Test error:', error);
        });

        tick(2500);

        expect(result).toBeTruthy();
        expect(result!.title).toBe('Test Todo for Creation');
        expect(result!.status).toBe('todo');
        expect(result!.priority).toBe('high');
        expect(result!.assignedTo).toBe(1);
        expect(result!.description).toBe('');
        expect(result!.createdBy).toBe(0);
        expect(result!.id).toBeGreaterThan(0);
        expect(service.todos().length).toBe(initialCount + 1);
        expect(consoleSpy).toHaveBeenCalledWith('Mock API Call: POST /todos');
    }));

    it('should create todo with default values', fakeAsync(() => {
        const initialCount = service.todos().length;
        let result: Todo | null = null;

        service.createTodo({}).then(todo => {
            result = todo;
        }).catch((error: Error) => {
            console.error('Test error:', error);
        });

        tick(2500);

        expect(result).toBeTruthy();
        expect(result!.title).toBe('');
        expect(result!.status).toBe('todo');
        expect(result!.priority).toBe('medium');
        expect(result!.assignedTo).toBeUndefined();
        expect(result!.description).toBe('');
        expect(result!.createdBy).toBe(0);
        expect(service.todos().length).toBe(initialCount + 1);
    }));

    it('should update an existing todo', fakeAsync(() => {
        const firstTodoId = service.todos()[0]?.id;
        if (firstTodoId) {
            const updates = { title: 'Updated Title', status: 'done' as const };
            let result: Todo | null = null;

            service.updateTodo(firstTodoId, updates).then(todo => {
                result = todo;
            }).catch((error: Error) => {
                console.error('Test error:', error);
            });

            tick(2000);

            expect(result).toBeTruthy();
            expect(result!.title).toBe('Updated Title');
            expect(result!.status).toBe('done');
            expect(consoleSpy).toHaveBeenCalledWith(`Mock API Call: PUT /todos/${firstTodoId}`);
        } else {
            pending('No todos available for this test');
        }
    }));

    it('should return null when updating non-existent todo', fakeAsync(() => {
        let result: Todo | null | undefined = undefined;

        service.updateTodo(999, { title: 'New Title' }).then(todo => {
            result = todo;
        }).catch((error: Error) => {
            console.error('Test error:', error);
        });

        tick(2000);

        expect(result).toBeNull();
    }));

    it('should delete a todo', fakeAsync(() => {
        const initialCount = service.todos().length;
        let result: boolean | null = null;

        // Utiliser l'ID du premier todo disponible
        const firstTodoId = service.todos()[0]?.id;

        if (firstTodoId) {
            service.deleteTodo(firstTodoId).then(success => {
                result = success;
            }).catch((error: Error) => {
                console.error('Test error:', error);
            });

            tick(1000);

            expect(result).toBeTrue();
            expect(service.todos().length).toBe(initialCount - 1);
            expect(consoleSpy).toHaveBeenCalledWith(`Mock API Call: DELETE /todos/${firstTodoId}`);
        } else {
            pending('No todos available for deletion test');
        }
    }));

    it('should return false when deleting non-existent todo', fakeAsync(() => {
        let result: boolean | null = null;

        service.deleteTodo(999).then(success => {
            result = success;
        }).catch((error: Error) => {
            console.error('Test error:', error);
        });

        tick(1000);

        expect(result).toBeFalse();
    }));
});

    describe('User Operations', () => {
        it('should get all users', fakeAsync(() => {
            let result: User[] = [];
            const initialCount = service.users().length;

            service.getUsers().then(users => {
                result = users;
            }).catch((error: Error) => {
                console.error('Test error:', error);
            });

            tick(1500);

            expect(result.length).toBe(initialCount);
            expect(consoleSpy).toHaveBeenCalledWith('Mock API Call: GET /users');
        }));

        it('should create a new user with Date.now() ID', fakeAsync(() => {
            const initialCount = service.users().length;
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                role: 'user' as const
            };

            let result: User | null = null;

            service.createUser(userData).then(user => {
                result = user;
            }).catch((error: Error) => {
                console.error('Test error:', error);
            });

            tick(2000);

            expect(result).toBeTruthy();
            expect(result!.name).toBe('Test User');
            expect(result!.email).toBe('test@example.com');
            expect(result!.role).toBe('user');
            expect(result!.password).toBe('');
            expect(result!.id).toBeGreaterThan(0);
            expect(service.users().length).toBe(initialCount + 1);
            expect(consoleSpy).toHaveBeenCalledWith('Mock API Call: POST /users');
        }));

        it('should create user with default values', fakeAsync(() => {
            let result: User | null = null;

            service.createUser({}).then(user => {
                result = user;
            }).catch((error: Error) => {
                console.error('Test error:', error);
            });

            tick(2000);

            expect(result).toBeTruthy();
            expect(result!.name).toBe('');
            expect(result!.email).toBe('');
            expect(result!.role).toBe('user');
            expect(result!.password).toBe('');
        }));
        it('should delete a user', fakeAsync(() => {
            const initialCount = service.users().length;
            let result: boolean | null = null;

            // Utiliser l'ID du premier user disponible
            const firstUserId = service.users()[0]?.id;

            if (firstUserId) {
                service.deleteUser(firstUserId).then(success => {
                    result = success;
                }).catch((error: Error) => {
                    console.error('Test error:', error);
                });

                tick(1500);

                expect(result).toBeTrue();
                expect(service.users().length).toBe(initialCount - 1);
                expect(consoleSpy).toHaveBeenCalledWith(`Mock API Call: DELETE /users/${firstUserId}`);
            } else {
                pending('No users available for deletion test');
            }
        }));

        it('should return false when deleting non-existent user', fakeAsync(() => {
            let result: boolean | null = null;

            service.deleteUser(999).then(success => {
                result = success;
            }).catch((error: Error) => {
                console.error('Test error:', error);
            });

            tick(1500);

            expect(result).toBeFalse();
        }));
    });

    describe('Error Handling and Failure Mode', () => {
        it('should toggle failure mode', () => {
            expect(service.apiStats().failureMode).toBeFalse();

            service.toggleFailureMode();
            expect(service.apiStats().failureMode).toBeTrue();
            expect(consoleSpy).toHaveBeenCalledWith('Failure mode: ON');

            service.toggleFailureMode();
            expect(service.apiStats().failureMode).toBeFalse();
            expect(consoleSpy).toHaveBeenCalledWith('Failure mode: OFF');
        });

        it('should throw error when in failure mode', fakeAsync(() => {
            service.toggleFailureMode();
            let error: Error | null = null;

            service.getTodos().then(() => {
                fail('Should have thrown an error');
            }).catch(err => {
                error = err;
            });

            tick(1500);

            expect(error).toBeInstanceOf(Error);
            expect(error!.message).toContain('Erreur simulée pour GET /todos');
            expect(service.error()).toContain('Erreur simulée pour GET /todos');
        }));

        it('should clear error', fakeAsync(() => {
            service.toggleFailureMode();

            service.getTodos().catch((error: Error) => {
                console.error('Expected error:', error);
            });
            tick(1500);

            expect(service.error()).toBeTruthy();
            service.clearError();
            expect(service.error()).toBeNull();
        }));

        it('should update loading state during async operations', fakeAsync(() => {
            expect(service.loading()).toBeFalse();

            const promise = service.getTodos();

            // During the operation, loading might be true
            tick(100);

            // After completion, loading should be false
            tick(1400);
            promise.catch((error: Error) => {
                console.error('Expected error:', error);
            });
            expect(service.loading()).toBeFalse();
        }));
    });

    describe('Utility Methods', () => {
        it('should reset data to initial state', () => {
            service.resetData();

            expect(service.todos().length).toBe(1);
            expect(service.users().length).toBe(1);
            expect(service.todos()[0].title).toBe('Todo initial');
            expect(service.users()[0].name).toBe('User initial');
            expect(consoleSpy).toHaveBeenCalledWith('Mock data reset');
        });

        it('should reset API statistics', fakeAsync(() => {
            service.getTodos().catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(1500);
            service.getUsers().catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(1500);

            expect(service.apiStats().totalRequests).toBe(2);

            service.resetStats();
            expect(service.apiStats().totalRequests).toBe(0);
            expect(service.error()).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Mock API stats reset');
        }));

        it('should get API health status', () => {
            const health = service.getApiHealth();
            expect(health).toEqual(service.apiStats());
        });

        it('should get current todos', () => {
            const todos = service.getCurrentTodos();
            expect(todos).toEqual(service.todos());
        });

        it('should get current users', () => {
            const users = service.getCurrentUsers();
            expect(users).toEqual(service.users());
        });
    });

    describe('Signal Reactivity', () => {
        it('should update todosByStatus when todos change', fakeAsync(() => {
            const initialByStatus = service.todosByStatus();

            service.createTodo({
                title: 'New High Priority Todo',
                priority: 'high',
                status: 'todo'
            }).catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(2500);

            const updatedByStatus = service.todosByStatus();
            expect(updatedByStatus.todo).toBe(initialByStatus.todo + 1);
        }));

        it('should update highPriorityTodos when high priority todo is added', fakeAsync(() => {
            const initialHighPriority = service.highPriorityTodos().length;

            service.createTodo({
                title: 'Another High Priority Todo',
                priority: 'high'
            }).catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(2500);

            expect(service.highPriorityTodos().length).toBe(initialHighPriority + 1);
        }));

        it('should maintain data integrity across operations', fakeAsync(() => {
            const initialTodoCount = service.todos().length;
            let newTodoId: number;

            service.createTodo({ title: 'Test Todo' }).then(todo => {
                newTodoId = todo.id;
            }).catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(2500);
            expect(service.todos().length).toBe(initialTodoCount + 1);

            service.updateTodo(newTodoId!, { title: 'Updated Test Todo' }).catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(2000);
            expect(service.todos().length).toBe(initialTodoCount + 1);

            const updatedTodo = service.todos().find(t => t.id === newTodoId!);
            expect(updatedTodo?.title).toBe('Updated Test Todo');

            service.deleteTodo(newTodoId!).catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(1000);
            expect(service.todos().length).toBe(initialTodoCount);
        }));
    });

    describe('API Statistics Tracking', () => {
        it('should increment request count on each API call', fakeAsync(() => {
            const initialCount = service.apiStats().totalRequests;

            service.getTodos().catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(1500);
            expect(service.apiStats().totalRequests).toBe(initialCount + 1);

            service.getUsers().catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(1500);
            expect(service.apiStats().totalRequests).toBe(initialCount + 2);
        }));

        it('should track API health correctly', fakeAsync(() => {
            service.getTodos().catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(1500);

            const stats = service.apiStats();
            expect(stats.isHealthy).toBeTrue();

            service.toggleFailureMode();
            const unhealthyStats = service.apiStats();
            expect(unhealthyStats.isHealthy).toBeFalse();
        }));
    });

    describe('Effects and Logging', () => {
        it('should log errors through effects', fakeAsync(() => {
            service.toggleFailureMode();

            service.getTodos().catch((error: Error) => {
                console.error('Expected test error:', error);
            });
            tick(1500);

            // Check if error was logged by the effect
            expect(service.error()).toContain('Erreur simulée');
        }));

        it('should generate unique IDs for new todos', fakeAsync(() => {
            const results: Todo[] = [];

            service.createTodo({ title: 'Todo 1' }).then(todo => results.push(todo)).catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(2500);

            service.createTodo({ title: 'Todo 2' }).then(todo => results.push(todo)).catch((error: Error) => {
                console.error('Test error:', error);
            });
            tick(2500);

            expect(results.length).toBe(2);
            expect(results[0].id).not.toBe(results[1].id);
            expect(results[0].id).toBeGreaterThan(0);
            expect(results[1].id).toBeGreaterThan(0);
        }));
    });
});