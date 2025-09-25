import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from '../../storage/services/localStorage';
import { AuthService } from '../../auth/services/auth';
import { NotificationService } from '../../../shared/service/notifications-service';
import { Comment, CreateCommentDto, UpdateCommentDto } from '../models/comments';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private readonly storageKey = 'app_comments';
  private storage = inject(StorageService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  private readonly _comments = signal<Comment[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public signals
  public readonly comments = computed(() => this._comments());
  public readonly isLoading = computed(() => this._isLoading());
  public readonly error = computed(() => this._error());

  constructor() {
    this.loadComments();
  }

  /**
   * Get comments for a specific todo
   */
  getCommentsByTodoId(todoId: number) {
    return computed(() =>
      this._comments().filter(comment => comment.todoId === todoId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }

  /**
   * Get comments count for a specific todo
   */
  getCommentsCount(todoId: number) {
    return computed(() =>
      this._comments().filter(comment => comment.todoId === todoId).length
    );
  }

  /**
   * Create a new comment
   */
  async createComment(commentData: CreateCommentDto): Promise<Comment | null> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      const newComment: Comment = {
        id: Date.now(),
        todoId: commentData.todoId,
        userId: currentUser.id,
        userName: currentUser.name,
        content: commentData.content.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const currentComments = this._comments();
      const updatedComments = [...currentComments, newComment];

      this._comments.set(updatedComments);
      this.saveComments(updatedComments);

      this.notificationService.success('Commentaire ajouté avec succès');
      return newComment;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du commentaire';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      return null;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Update an existing comment
   */
  async updateComment(commentId: number, updateData: UpdateCommentDto): Promise<Comment | null> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      const currentComments = this._comments();
      const commentIndex = currentComments.findIndex(c => c.id === commentId);

      if (commentIndex === -1) {
        throw new Error('Commentaire non trouvé');
      }

      const comment = currentComments[commentIndex];

      // Check if user owns the comment
      if (comment.userId !== currentUser.id && currentUser.role !== 'admin') {
        throw new Error('Non autorisé à modifier ce commentaire');
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const updatedComment: Comment = {
        ...comment,
        content: updateData.content.trim(),
        updatedAt: new Date(),
        isEdited: true
      };

      const updatedComments = [...currentComments];
      updatedComments[commentIndex] = updatedComment;

      this._comments.set(updatedComments);
      this.saveComments(updatedComments);

      this.notificationService.success('Commentaire modifié avec succès');
      return updatedComment;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la modification du commentaire';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      return null;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: number): Promise<boolean> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      const currentComments = this._comments();
      const comment = currentComments.find(c => c.id === commentId);

      if (!comment) {
        throw new Error('Commentaire non trouvé');
      }

      // Check if user owns the comment or is admin
      if (comment.userId !== currentUser.id && currentUser.role !== 'admin') {
        throw new Error('Non autorisé à supprimer ce commentaire');
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const updatedComments = currentComments.filter(c => c.id !== commentId);

      this._comments.set(updatedComments);
      this.saveComments(updatedComments);

      this.notificationService.success('Commentaire supprimé avec succès');
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression du commentaire';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Load comments from storage
   */
  private loadComments(): void {
    try {
      const saved = this.storage.get<Comment[]>(this.storageKey);
      if (saved && Array.isArray(saved)) {
        // Convert date strings back to Date objects
        const comments = saved.map(comment => ({
          ...comment,
          createdAt: new Date(comment.createdAt),
          updatedAt: new Date(comment.updatedAt)
        }));
        this._comments.set(comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      this._comments.set([]);
    }
  }

  /**
   * Save comments to storage
   */
  private saveComments(comments: Comment[]): void {
    try {
      this.storage.set(this.storageKey, comments);
    } catch (error) {
      console.error('Error saving comments:', error);
    }
  }

  /**
   * Clear all comments (for testing/admin)
   */
  clearAllComments(): void {
    this._comments.set([]);
    this.storage.remove(this.storageKey);
    this.notificationService.success('Tous les commentaires ont été supprimés');
  }
}