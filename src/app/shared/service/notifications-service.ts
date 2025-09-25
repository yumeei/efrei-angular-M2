import { Injectable, signal, computed } from '@angular/core';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  timestamp: Date;
  actions?: { label: string; action: () => void }[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _notifications = signal<Notification[]>([]);
  public readonly notifications = computed(() => this._notifications());
  public readonly hasNotifications = computed(() => this._notifications().length > 0);

  show(message: string, type: Notification['type'] = 'info', duration = 4000, actions?: Notification['actions']): string {
    const id = this.generateId();
    const notification: Notification = {
      id,
      message,
      type,
      duration,
      timestamp: new Date(),
      actions
    };

    this._notifications.update(current => [...current, notification]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  success(message: string, duration?: number, actions?: Notification['actions']): string {
    return this.show(message, 'success', duration, actions);
  }

  error(message: string, duration?: number, actions?: Notification['actions']): string {
    return this.show(message, 'error', duration, actions);
  }

  warning(message: string, duration?: number, actions?: Notification['actions']): string {
    return this.show(message, 'warning', duration, actions);
  }

  info(message: string, duration?: number, actions?: Notification['actions']): string {
    return this.show(message, 'info', duration, actions);
  }

  remove(id: string): void {
    this._notifications.update(current => current.filter(n => n.id !== id));
  }

  clear(): void {
    this._notifications.set([]);
  }

  private generateId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}