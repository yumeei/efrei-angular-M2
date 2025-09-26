import { Component, signal, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Todo } from '../models/todo';
import { TodoService } from '../services/todo';
import { PriorityPipe } from '../../../shared/pipes/priority-pipe';
import { HighlightDirective } from '../../../shared/directives/highlight';
import { NotificationService } from '../../../shared/service/notifications-service';
import { CommentsComponent } from './comments';
import { CommentsService } from '../services/comments';
import { DeadlineService } from '../services/deadlines';
import { DeadlinePickerComponent } from './deadline-picker';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PriorityPipe, HighlightDirective, CommentsComponent, DeadlinePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Dashboard des statistiques -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Statistiques en temps réel</h2>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-sm font-medium text-gray-500">Total</h3>
          <p class="text-2xl font-bold text-gray-900">{{ todoService.todoStats().total }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-sm font-medium text-gray-500">Complétés</h3>
          <p class="text-2xl font-bold text-green-600">{{ todoService.todoStats().completed }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-sm font-medium text-gray-500">En cours</h3>
          <p class="text-2xl font-bold text-blue-600">{{ todoService.todoStats().inProgress }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-sm font-medium text-gray-500">Priorité haute</h3>
          <p class="text-2xl font-bold text-red-600">{{ todoService.todoStats().highPriority }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-sm font-medium text-gray-500">Taux de complétion</h3>
          <p class="text-2xl font-bold text-purple-600">
            {{ todoService.todoStats().completionRate | number: '1.0-0' }}%
          </p>
        </div>
      </div>
    </div>
    <!-- Dashboard des deadlines -->
    <div class="mb-8">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Échéances en cours</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <h3 class="text-sm font-medium text-red-700">🚨 En retard</h3>
          <p class="text-2xl font-bold text-red-600">{{ deadlineService.getOverdueCount() }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <h3 class="text-sm font-medium text-orange-700">⚡ Urgents</h3>
          <p class="text-2xl font-bold text-orange-600">{{ deadlineService.getUrgentCount() }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <h3 class="text-sm font-medium text-blue-700">📋 Avec échéance</h3>
          <p class="text-2xl font-bold text-blue-600">{{ todoService.todosWithDeadlines().length }}</p>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    @if (loading()) {
      <div class="text-center py-8">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"
        ></div>
        <p class="mt-2 text-gray-600">Chargement des todos...</p>
      </div>
    } @else {
      <!-- Formulaire d'ajout -->
      <div class="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 class="text-xl font-semibold mb-4">Ajouter une tâche</h3>
        <form (ngSubmit)="addTodo()" #todoForm="ngForm">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              [(ngModel)]="newTodo.title"
              name="title"
              placeholder="Titre de la tâche"
              class="border p-2 rounded"
              required
            />

            <input
              type="text"
              [(ngModel)]="newTodo.description"
              name="description"
              placeholder="Description (optionnel)"
              class="border p-2 rounded"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select [(ngModel)]="newTodo.priority" name="priority" class="border p-2 rounded">
              <option value="low">Basse priorité</option>
              <option value="medium">Priorité moyenne</option>
              <option value="high">Haute priorité</option>
            </select>

            <button
              type="submit"
              [disabled]="!todoForm.form.valid || addingTodo()"
              class="bg-violet-600 text-white px-4 py-2 rounded hover:bg-violet-700 disabled:opacity-50"
            >
              @if (addingTodo()) {
                <span
                  class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                ></span>
                Ajout en cours...
              } @else {
                Ajouter
              }
            </button>
          </div>
        </form>
      </div>
    }

    <!-- Colonnes Kanban -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- À faire -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          À faire
          <span class="text-sm text-gray-500">({{ todoService.pendingTodos().length }})</span>
        </h3>
        <div class="space-y-3">
          @for (todo of todoService.pendingTodos(); track trackByTodoId($index, todo)) {
            <div
              [class]="getCardClasses(todo)"
              class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-400"
              [appHighlight]="todo.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'transparent'"
              [appHighlightDelay]="todo.priority === 'high' ? 500 : 0"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-gray-900">{{ todo.title }}</h4>
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    [class.bg-red-100]="todo.priority === 'high'"
                    [class.text-red-800]="todo.priority === 'high'"
                    [class.bg-yellow-100]="todo.priority === 'medium'"
                    [class.text-yellow-800]="todo.priority === 'medium'"
                    [class.bg-green-100]="todo.priority === 'low'"
                    [class.text-green-800]="todo.priority === 'low'"
                  >
                    {{ todo.priority | priority }}
                  </span>
                <!--  Deadline Picker -->
                <app-deadline-picker
                  [deadline]="todo.deadline || null"
                  (deadlineChange)="updateDeadline(todo.id, $event)"
                ></app-deadline-picker>
                @if (commentService.getCommentsCount(todo.id)() > 0) {
                  <div class="flex items-center gap-1 text-gray-500">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <span class="text-xs">{{ commentService.getCommentsCount(todo.id)() }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Affichage de l'échéance -->
            @if (todo.deadline) {
              <div class="mb-3">
                <div [class]="deadlineService.getDeadlineText(todo).color" class="flex items-center gap-1 text-xs">
                  <span>{{ deadlineService.getDeadlineText(todo).text }}</span>
                  <span class="text-gray-400">- {{ todo.deadline | date: 'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
            }
              @if (todo.description) {
                <p class="text-sm text-gray-600 mb-3">{{ todo.description }}</p>
              }
              <div class="flex justify-between items-center text-xs text-gray-500">
                <span>Créé le {{ todo.createdAt | date: 'dd/MM/yyyy' }}</span>

                <div class="flex items-center gap-2">
                <button
                  (click)="toggleComments(todo.id)"
                  class="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 px-2 py-1 rounded"
                  title="{{ showComments().has(todo.id) ? 'Masquer' : 'Afficher' }} les commentaires"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  {{ showComments().has(todo.id) ? 'Masquer' : 'Commentaires' }}
                </button>

                <button
                  (click)="updateStatus(todo.id, 'in-progress')"
                  class="text-base text-violet-600 hover:text-violet-800"
                >
                  Commencer
                </button>
              </div>
              </div>
              @if (showComments().has(todo.id)) {
                <div class="mt-3 pt-3 border-t border-gray-200">
                  <app-comments [todoId]="todo.id"></app-comments>
                </div>
              }
            </div>
}
          </div>
        </div>

      <!-- En cours -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          En cours
          <span class="text-sm text-gray-500">({{ todoService.inProgressTodos().length }})</span>
        </h3>
        <div class="space-y-3">
          @for (todo of todoService.inProgressTodos(); track trackByTodoId($index, todo)) {
            <div
              [class]="getCardClasses(todo)"
              class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-400"
              [appHighlight]="todo.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'transparent'"
              [appHighlightDelay]="todo.priority === 'high' ? 500 : 0"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-gray-900">{{ todo.title }}</h4>
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    [class.bg-red-100]="todo.priority === 'high'"
                    [class.text-red-800]="todo.priority === 'high'"
                    [class.bg-yellow-100]="todo.priority === 'medium'"
                    [class.text-yellow-800]="todo.priority === 'medium'"
                    [class.bg-green-100]="todo.priority === 'low'"
                    [class.text-green-800]="todo.priority === 'low'"
                  >
                    {{ todo.priority | priority }}
                  </span>
                  <!-- Deadline Picker -->
                  <app-deadline-picker
                    [deadline]="todo.deadline || null"
                    (deadlineChange)="updateDeadline(todo.id, $event)"
                  ></app-deadline-picker>
                  @if (commentService.getCommentsCount(todo.id)() > 0) {
                    <div class="flex items-center gap-1 text-gray-500">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                      <span class="text-xs">{{ commentService.getCommentsCount(todo.id)() }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Affichage de l'échéance -->
              @if (todo.deadline) {
                <div class="mb-3">
                  <div [class]="deadlineService.getDeadlineText(todo).color" class="flex items-center gap-1 text-xs">
                    <span>{{ deadlineService.getDeadlineText(todo).text }}</span>
                    <span class="text-gray-400">- {{ todo.deadline | date: 'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                </div>
              }

              @if (todo.description) {
                <p class="text-sm text-gray-600 mb-3">{{ todo.description }}</p>
              }
              <div class="flex justify-between items-center text-xs text-gray-500">
                <span>Mis à jour le {{ todo.updatedAt | date: 'dd/MM/yyyy' }}</span>
                <div class="flex items-center gap-2">
                <button
                  (click)="toggleComments(todo.id)"
                  class="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 px-2 py-1 rounded"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  {{ showComments().has(todo.id) ? 'Masquer' : 'Commentaires' }}
                </button>

                <button
                  (click)="updateStatus(todo.id, 'done')"
                  class="text-base text-green-600 hover:text-green-800"
                >
                  Terminer
                </button>
              </div>
            </div>

            @if (showComments().has(todo.id)) {
              <div class="mt-3 pt-3 border-t border-gray-200">
                <app-comments [todoId]="todo.id"></app-comments>
              </div>
            }
            </div>
          }
        </div>
      </div>

      <!-- Terminé -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          Terminé
          <span class="text-sm text-gray-500">({{ todoService.completedTodos().length }})</span>
        </h3>
        <div class="space-y-3">
          @for (todo of todoService.completedTodos(); track trackByTodoId($index, todo)) {
            <div
              [class]="getCardClasses(todo)"
              class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-400"
              [appHighlight]="todo.priority === 'high' ? 'rgba(34, 197, 94, 0.1)' : 'transparent'"
              [appHighlightDelay]="todo.priority === 'high' ? 500 : 0"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-gray-900 line-through">{{ todo.title }}</h4>
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    [class.bg-red-100]="todo.priority === 'high'"
                    [class.text-red-800]="todo.priority === 'high'"
                    [class.bg-yellow-100]="todo.priority === 'medium'"
                    [class.text-yellow-800]="todo.priority === 'medium'"
                    [class.bg-green-100]="todo.priority === 'low'"
                    [class.text-green-800]="todo.priority === 'low'"
                  >
                    {{ todo.priority | priority }}
                  </span>

                  <!-- Deadline Picker (read-only pour les terminés) -->
                <app-deadline-picker
                  [deadline]="todo.deadline || null"
                  (deadlineChange)="updateDeadline(todo.id, $event)"
                ></app-deadline-picker>

                @if (commentService.getCommentsCount(todo.id)() > 0) {
                  <div class="flex items-center gap-1 text-gray-500">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <span class="text-xs">{{ commentService.getCommentsCount(todo.id)() }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Affichage de l'échéance (avec style barré) -->
            @if (todo.deadline) {
              <div class="mb-3">
                <div class="flex items-center gap-1 text-xs text-gray-500 line-through">
                  <span>Échéance respectée</span>
                  <span class="text-gray-400">- {{ todo.deadline | date: 'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
            }

            @if (todo.description) {
              <p class="text-sm text-gray-600 mb-3 line-through">{{ todo.description }}</p>
            }
              <div class="flex justify-between items-center text-xs text-gray-500">
                <span>Terminé le {{ todo.updatedAt | date: 'dd/MM/yyyy' }}</span>

                <div class="flex items-center gap-2">
                <button
                  (click)="toggleComments(todo.id)"
                  class="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 px-2 py-1 rounded"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  {{ showComments().has(todo.id) ? 'Masquer' : 'Commentaires' }}
                </button>

                <button (click)="deleteTodo(todo.id)" class="text-red-600 hover:text-red-800">
                  Supprimer
                </button>
              </div>
            </div>

            @if (showComments().has(todo.id)) {
            <div class="mt-3 pt-3 border-t border-gray-200">
              <app-comments [todoId]="todo.id"></app-comments>
            </div>
          }
          </div>
        }
      </div>
    </div>
  </div>
  `,
  styles: [],
})
export class TodoListComponent implements OnInit {
  todos = signal<Todo[]>([]);
  loading = signal(true);
  addingTodo = signal(false);

  newTodo = {
    title: '',
    description: '',
    priority: 'medium' as const,
  };

  todoService = inject(TodoService);
  private notificationService = inject(NotificationService);
  protected readonly commentService = inject(CommentsService);
  protected readonly deadlineService = inject(DeadlineService);
  protected readonly showComments = signal(new Set<number>());

  async ngOnInit() {
    await this.loadTodos();
  }

  async loadTodos() {
    try {
      this.loading.set(true);
      const todos = await this.todoService.getAllTodos();
      this.todos.set(todos);
    } catch (error) {
      console.error('Erreur lors du chargement des todos:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async addTodo() {
    if (this.newTodo.title.trim()) {
      try {
        this.addingTodo.set(true);
        await this.todoService.createTodo({
          title: this.newTodo.title,
          description: this.newTodo.description,
          priority: this.newTodo.priority,
        });

        // recharge todos
        await this.loadTodos();

        // reset form
        this.newTodo.title = '';
        this.newTodo.description = '';
      } catch (error) {
        console.error('Erreur lors de l\'ajout du todo:', error);
      } finally {
        this.addingTodo.set(false);
      }
    }
  }

  toggleComments(todoId: number): void {
    this.showComments.update(set => {
      const newSet = new Set(set);
      if (newSet.has(todoId)) {
        newSet.delete(todoId);
      } else {
        newSet.add(todoId);
      }
      return newSet;
    });
  }

  async updateStatus(id: number, status: Todo['status']) {
    try {
      await this.todoService.updateTodo(id, { status });
      await this.loadTodos();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  }

  async deleteTodo(id: number) {
    try {
      await this.todoService.deleteTodo(id);
      await this.loadTodos();
      this.notificationService.success('Tâche supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      this.notificationService.error('Erreur lors de la suppression de la tâche');
    }
  }

  getTodosByStatus(status: Todo['status']): Todo[] {
    return this.todos().filter((todo) => todo.status === status);
  }

  trackByTodoId(_: number, todo: Todo): string {
    return todo.id.toString();
  }

  async updateDeadline(todoId: number, deadline: Date | null): Promise<void> {
    await this.todoService.updateDeadline(todoId, deadline);
  }
  getCardClasses(todo: Todo): string {
    const baseClasses = ['bg-white', 'p-4', 'rounded-lg', 'shadow-sm', 'border-l-4'];

    // Status-based border colors
    if (todo.status === 'todo') baseClasses.push('border-gray-400');
    if (todo.status === 'in-progress') baseClasses.push('border-blue-400');
    if (todo.status === 'done') baseClasses.push('border-green-400');

    // Deadline-based styling
    const deadlineClasses = this.deadlineService.getDeadlineClasses(todo);
    baseClasses.push(...deadlineClasses);

    return baseClasses.join(' ');
  }
}
