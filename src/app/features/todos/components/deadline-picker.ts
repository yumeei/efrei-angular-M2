import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-deadline-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative">
      <button
        (click)="togglePicker()"
        [class]="getButtonClasses()"
        class="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200"
      >
        <span>{{ getButtonIcon() }}</span>
        <span>{{ getButtonText() }}</span>
        @if (deadline) {
          <button
            (click)="removeDeadline($event)"
            class="ml-1 text-red-500 hover:text-red-700"
            title="Supprimer l'échéance"
          >
            ✕
          </button>
        }
      </button>

      @if (showPicker()) {
        <div class="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-64">
          <h4 class="text-sm font-semibold text-gray-900 mb-3">Définir une échéance</h4>

          <!-- Quick Options -->
          <div class="grid grid-cols-2 gap-2 mb-4">
            <button
              (click)="setQuickDeadline(1)"
              class="px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Demain
            </button>
            <button
              (click)="setQuickDeadline(3)"
              class="px-3 py-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
            >
              Dans 3 jours
            </button>
            <button
              (click)="setQuickDeadline(7)"
              class="px-3 py-2 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
            >
              Dans 1 semaine
            </button>
            <button
              (click)="setQuickDeadline(14)"
              class="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Dans 2 semaines
            </button>
          </div>

          <!-- Custom Date -->
          <div class="mb-4">
            <label for="custom-date-input" class="block text-xs font-medium text-gray-700 mb-2">Date personnalisée</label>
            <input
              type="datetime-local"
              [(ngModel)]="customDate"
              class="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              [min]="minDate"
            />
          </div>

          <!-- Actions -->
          <div class="flex justify-between items-center">
            <button
              (click)="togglePicker()"
              class="px-3 py-2 text-xs text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              (click)="saveCustomDeadline()"
              [disabled]="!customDate()"
              class="px-3 py-2 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              Définir
            </button>
          </div>
        </div>
      }
    </div>

    <!-- Background overlay -->
    @if (showPicker()) {
      <div
        class="fixed inset-0 z-40"
        (click)="togglePicker()"
        (keydown.escape)="togglePicker()"
        role="button"
        aria-label="Close deadline picker"
        tabindex="0"
      ></div>
    }
  `
})
export class DeadlinePickerComponent {
  @Input() deadline: Date | null = null;
  @Output() deadlineChange = new EventEmitter<Date | null>();

  protected readonly showPicker = signal(false);
  protected readonly customDate = signal('');

  protected readonly minDate = new Date().toISOString().slice(0, 16);

  togglePicker(): void {
    this.showPicker.update(show => !show);
    if (this.showPicker() && this.deadline) {
      // Pre-fill custom date if deadline exists
      this.customDate.set(new Date(this.deadline).toISOString().slice(0, 16));
    }
  }

  setQuickDeadline(days: number): void {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    deadline.setHours(23, 59, 0, 0); // End of day

    this.deadlineChange.emit(deadline);
    this.showPicker.set(false);
  }

  saveCustomDeadline(): void {
    if (!this.customDate()) return;

    const deadline = new Date(this.customDate());
    this.deadlineChange.emit(deadline);
    this.showPicker.set(false);
  }

  removeDeadline(event: Event): void {
    event.stopPropagation();
    this.deadlineChange.emit(null);
  }

  getButtonClasses(): string {
    if (!this.deadline) {
      return 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    }

    const now = new Date();
    const deadlineDate = new Date(this.deadline);
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return 'bg-red-100 text-red-800 border border-red-300 animate-pulse';
    } else if (daysUntil <= 1) {
      return 'bg-red-100 text-red-700 border border-red-200';
    } else if (daysUntil <= 3) {
      return 'bg-orange-100 text-orange-700 border border-orange-200';
    } else if (daysUntil <= 7) {
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    }

    return 'bg-blue-100 text-blue-700 border border-blue-200';
  }

  getButtonIcon(): string {
    if (!this.deadline) return '';

    const now = new Date();
    const deadlineDate = new Date(this.deadline);
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'URGENT';
    if (daysUntil === 0) return 'AUJOURD\'HUI';
    if (daysUntil === 1) return 'DEMAIN';
    if (daysUntil <= 3) return 'BIENTÔT';
    if (daysUntil <= 7) return 'CETTE SEMAINE';

    return '📅';
  }

  getButtonText(): string {
    if (!this.deadline) return 'Ajouter une échéance';

    const now = new Date();
    const deadlineDate = new Date(this.deadline);
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      const daysPast = Math.abs(daysUntil);
      return `Retard ${daysPast}j`;
    } else if (daysUntil === 0) {
      return 'Aujourd\'hui';
    } else if (daysUntil === 1) {
      return 'Demain';
    } else if (daysUntil <= 7) {
      return `${daysUntil} jours`;
    }

    return deadlineDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }
}