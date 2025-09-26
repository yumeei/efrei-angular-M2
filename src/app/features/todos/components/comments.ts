import { Component, Input, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentsService } from '../services/comments';
import { AuthService } from '../../auth/services/auth';
import { Comment } from '../models/comments';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            Commentaires ({{ commentsCount() }})
          </h3>
          @if (commentsService.isLoading()) {
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          }
        </div>
      </div>

      <!-- Comment Form -->
      @if (currentUser()) {
        <div class="p-4 border-b border-gray-200 bg-gray-50">
          <div class="flex gap-3">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span class="text-sm font-medium text-white">
                  {{ currentUser()?.name?.charAt(0)?.toUpperCase() }}
                </span>
              </div>
            </div>
            <div class="flex-1">
              <textarea
                [(ngModel)]="newCommentContent"
                placeholder="Ajouter un commentaire..."
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="2"
                maxlength="500"
                [disabled]="commentsService.isLoading()">
              </textarea>
              <div class="flex justify-between items-center mt-2">
                <span class="text-xs text-gray-500">
                  {{ newCommentContent().length }}/500
                </span>
                <button
                  type="button"
                  (click)="addComment()"
                  [disabled]="!newCommentContent().trim() || commentsService.isLoading()"
                  class="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  @if (commentsService.isLoading()) {
                    <span class="flex items-center gap-2">
                      <div class="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      Envoi...
                    </span>
                  } @else {
                    Commenter
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Comments List -->
      <div class="max-h-96 overflow-y-auto">
        @if (todoComments().length === 0) {
          <div class="p-8 text-center text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <p class="text-sm">Aucun commentaire pour le moment</p>
            <p class="text-xs text-gray-400 mt-1">Soyez le premier à commenter !</p>
          </div>
        } @else {
          @for (comment of todoComments(); track comment.id) {
            <div class="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <div class="flex gap-3">
                <!-- Avatar -->
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                    <span class="text-sm font-medium text-white">
                      {{ comment.userName.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                </div>

                <!-- Comment Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-medium text-gray-900">{{ comment.userName }}</span>
                    <time class="text-xs text-gray-500">{{ formatDate(comment.createdAt) }}</time>
                    @if (comment.isEdited) {
                      <span class="text-xs text-gray-400">(modifié)</span>
                    }
                  </div>

                  @if (editingComment() === comment.id) {
                    <!-- Edit Mode -->
                    <div class="mt-2">
                      <textarea
                        [(ngModel)]="editContent"
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="2"
                        maxlength="500">
                      </textarea>
                      <div class="flex justify-between items-center mt-2">
                        <span class="text-xs text-gray-500">{{ editContent().length }}/500</span>
                        <div class="flex gap-2">
                          <button
                            type="button"
                            (click)="cancelEdit()"
                            class="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors">
                            Annuler
                          </button>
                          <button
                            type="button"
                            (click)="saveEdit(comment.id)"
                            [disabled]="!editContent().trim() || editContent() === comment.content"
                            class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            Sauvegarder
                          </button>
                        </div>
                      </div>
                    </div>
                  } @else {
                    <!-- View Mode -->
                    <p class="text-sm text-gray-700 whitespace-pre-wrap break-words">{{ comment.content }}</p>
                    <!-- Actions -->
                    @if (canEditComment(comment)) {
                      <div class="flex gap-3 mt-2">
                        <button
                          type="button"
                          (click)="startEdit(comment)"
                          class="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                          Modifier
                        </button>
                        <button
                          type="button"
                          (click)="deleteComment(comment.id)"
                          class="text-xs text-red-600 hover:text-red-800 transition-colors">
                          Supprimer
                        </button>
                      </div>
                    }
                  }
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class CommentsComponent implements OnInit {
  @Input({ required: true }) todoId!: number;

  protected readonly commentsService = inject(CommentsService);
  private readonly authService = inject(AuthService);

  // Signals for form state
  protected readonly newCommentContent = signal('');
  protected readonly editingComment = signal<number | null>(null);
  protected readonly editContent = signal('');

  // Computed values
  protected readonly currentUser = computed(() => this.authService.getCurrentUser());
  protected readonly todoComments = computed(() =>
    this.commentsService.getCommentsByTodoId(this.todoId)()
  );
  protected readonly commentsCount = computed(() =>
    this.commentsService.getCommentsCount(this.todoId)()
  );

  ngOnInit(): void {
    console.warn();
  }

  async addComment(): Promise<void> {
    const content = this.newCommentContent().trim();
    if (!content) return;

    const result = await this.commentsService.createComment({
      todoId: this.todoId,
      content
    });

    if (result) {
      this.newCommentContent.set('');
    }
  }

  startEdit(comment: Comment): void {
    this.editingComment.set(comment.id);
    this.editContent.set(comment.content);
  }

  cancelEdit(): void {
    this.editingComment.set(null);
    this.editContent.set('');
  }

  async saveEdit(commentId: number): Promise<void> {
    const content = this.editContent().trim();
    if (!content) return;

    const result = await this.commentsService.updateComment(commentId, { content });

    if (result) {
      this.editingComment.set(null);
      this.editContent.set('');
    }
  }

  async deleteComment(commentId: number): Promise<void> {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      await this.commentsService.deleteComment(commentId);
    }
  }

  canEditComment(comment: Comment): boolean {
    const user = this.currentUser();
    return user ? (user.id === comment.userId || user.role === 'admin') : false;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}m`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}