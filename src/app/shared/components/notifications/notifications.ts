import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../service/notifications-service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 z-50 space-y-2">
      @for (notification of notificationService.notifications(); track notification.id) {
        <div
          class="w-fit max-w-md p-4 rounded-lg shadow-lg text-white flex items-center justify-between animate-slide-in"
          [class]="{
            'bg-red-500': notification.type === 'error',
            'bg-yellow-500': notification.type === 'warning',
            'bg-blue-500': notification.type === 'info',
            'bg-green-500': notification.type === 'success'
          }"
        >
          <div class="flex items-center space-x-2">
            <!-- Icône selon le type -->
            @if (notification.type === 'error') {
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            }
            @if (notification.type === 'warning') {
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            }
            @if (notification.type === 'info') {
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            }
            @if (notification.type === 'success') {
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            }
            <div class="flex flex-col">
              <span>{{ notification.message }}</span>
              <small class="text-xs opacity-80">{{ formatTime(notification.timestamp) }}</small>
            </div>
          </div>

          <!-- Actions optionnelles -->
          @if (notification.actions && notification.actions.length > 0) {
            <div class="flex space-x-2 ml-4">
              @for (action of notification.actions; track action.label) {
                <button
                  (click)="executeAction(action)"
                  class="px-2 py-1 text-xs bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-all"
                >
                  {{ action.label }}
                </button>
              }
            </div>
          }

          <button
            (click)="close(notification.id)"
            class="ml-4 text-white hover:text-gray-200 transition-colors"
            aria-label="Fermer la notification"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-slide-in {
      animation: slideInFromRight 0.3s ease-out;
    }

    @keyframes slideInFromRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .animate-slide-in:hover {
      transform: translateX(-4px);
      transition: transform 0.2s ease;
    }
  `]
})
export class NotificationsComponent {
  protected readonly notificationService = inject(NotificationService);

  close(id: string): void {
    this.notificationService.remove(id);
  }

  executeAction(action: { label: string; action: () => void }): void {
    action.action();
  }

  formatTime(timestamp: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp);
  }
}
