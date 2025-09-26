import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { TodoService } from './todo';
import { NotificationService } from '../../../shared/service/notifications-service';
import { Todo } from '../models/todo';

@Injectable({
  providedIn: 'root'
})
export class DeadlineService {
  private todoService = inject(TodoService);
  private notificationService = inject(NotificationService);

  // Signals for deadline management
  private readonly _deadlineAlerts = signal<Map<number, string>>(new Map());

  // Computed values
  public readonly deadlineAlerts = computed(() => this._deadlineAlerts());

  // Effect to check deadlines periodically
  private deadlineCheckEffect = effect(() => {
    const todos = this.todoService.todos();
    this.checkAllDeadlines(todos);
  });

  constructor() {
    // Check deadlines every minute
    setInterval(() => {
      const todos = this.todoService.todos();
      this.checkAllDeadlines(todos);
    }, 60000);
  }

  /**
   * Calculate days until deadline
   */
  getDaysUntilDeadline(deadline: Date): number {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Check if todo is overdue
   */
  isOverdue(deadline: Date): boolean {
    return new Date() > new Date(deadline);
  }

  /**
   * Get deadline status for styling
   */
  getDeadlineStatus(todo: Todo): 'overdue' | 'urgent' | 'warning' | 'normal' | 'none' {
    if (!todo.deadline) return 'none';

    const daysUntil = this.getDaysUntilDeadline(todo.deadline);

    if (daysUntil < 0) return 'overdue';      // Dépassé (rouge)
    if (daysUntil === 0) return 'urgent';     // Aujourd'hui (rouge clignotant)
    if (daysUntil === 1) return 'urgent';     // Demain (rouge)
    if (daysUntil <= 3) return 'warning';     // 2-3 jours (orange)
    if (daysUntil <= 7) return 'normal';      // 4-7 jours (jaune)

    return 'none'; // Plus de 7 jours (normal)
  }

  /**
   * Get deadline CSS classes
   */
  getDeadlineClasses(todo: Todo): string[] {
    const status = this.getDeadlineStatus(todo);
    const classes: string[] = [];

    switch (status) {
      case 'overdue':
        classes.push('border-red-500', 'bg-red-50', 'animate-pulse');
        break;
      case 'urgent':
        classes.push('border-red-400', 'bg-red-25', 'shadow-red-200');
        break;
      case 'warning':
        classes.push('border-orange-400', 'bg-orange-25');
        break;
      case 'normal':
        classes.push('border-yellow-400', 'bg-yellow-25');
        break;
      default:
        break;
    }

    return classes;
  }

  /**
   * Get deadline text with icon
   */
  getDeadlineText(todo: Todo): { text: string; color: string } {
    if (!todo.deadline) {
      return { text: 'Aucune échéance', color: 'text-gray-500' };
    }

    const daysUntil = this.getDaysUntilDeadline(todo.deadline);
    const status = this.getDeadlineStatus(todo);

    if (status === 'overdue') {
      const daysPast = Math.abs(daysUntil);
      return {
        text: `En retard de ${daysPast} jour${daysPast > 1 ? 's' : ''}`,
        color: 'text-red-600 font-semibold'
      };
    }

    if (daysUntil === 0) {
      return { text: 'Échéance aujourd\'hui !', color: 'text-red-600 font-semibold' };
    }

    if (daysUntil === 1) {
      return { text: 'Échéance demain', color: 'text-red-500 font-medium' };
    }

    if (daysUntil <= 3) {
      return { text: `${daysUntil} jours restants`, color: 'text-orange-600' };
    }

    if (daysUntil <= 7) {
      return { text: `${daysUntil} jours restants`, color: 'text-yellow-600' };
    }

    return { text: `${daysUntil} jours restants`, color: 'text-gray-600' };
  }

  /**
   * Check all todos for deadline alerts
   */
  private checkAllDeadlines(todos: Todo[]): void {
    const alerts = new Map<number, string>();

    todos.forEach(todo => {
      if (!todo.deadline || todo.status === 'done') return;

      const status = this.getDeadlineStatus(todo);

      if (status === 'overdue') {
        alerts.set(todo.id, `"${todo.title}" est en retard !`);
      } else if (status === 'urgent') {
        alerts.set(todo.id, `"${todo.title}" expire ${this.getDaysUntilDeadline(todo.deadline) === 0 ? 'aujourd\'hui' : 'demain'} !`);
      }
    });

    this._deadlineAlerts.set(alerts);
  }

  /**
   * Show deadline notifications
   */
  showDeadlineNotifications(): void {
    const alerts = this._deadlineAlerts();

    alerts.forEach((message) => {
      this.notificationService.warning(message);
    });
  }

  /**
   * Set deadline for a todo
   */
  setDeadline(): void {
    // This would typically call TodoService to update the todo
    // For now, we'll emit a notification
    this.notificationService.success('Échéance définie avec succès');
  }

  /**
   * Remove deadline from a todo
   */
  removeDeadline(): void {
    this.notificationService.info('Échéance supprimée');
  }

  /**
   * Get overdue todos count
   */
  getOverdueCount(): number {
    const todos = this.todoService.todos();
    return todos.filter(todo =>
      todo.deadline &&
      todo.status !== 'done' &&
      this.isOverdue(todo.deadline)
    ).length;
  }

  /**
   * Get urgent todos count (today + tomorrow)
   */
  getUrgentCount(): number {
    const todos = this.todoService.todos();
    return todos.filter(todo => {
      if (!todo.deadline || todo.status === 'done') return false;
      const daysUntil = this.getDaysUntilDeadline(todo.deadline);
      return daysUntil >= 0 && daysUntil <= 1;
    }).length;
  }
}