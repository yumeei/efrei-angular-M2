import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableColumnsService } from '../../service/table-columns';

@Component({
  selector: 'app-table-columns-manager',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block">
      <button
        type="button"
        class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        (click)="isOpen.set(!isOpen())">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
        </svg>
        Colonnes
      </button>

      @if (isOpen()) {
        <div class="absolute right-0 z-50 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200">
          <div class="px-4 py-3 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900">Gérer les colonnes</h3>
              <button
                type="button"
                class="text-xs text-gray-500 hover:text-gray-700"
                (click)="resetColumns()">
                Réinitialiser
              </button>
            </div>
          </div>

          <div class="max-h-60 overflow-y-auto p-2">
            @for (column of columnsService.getColumns(tableKey)(); track column.key) {
              <label class="flex items-center px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                     [class.opacity-50]="column.required"
                     [class.cursor-not-allowed]="column.required">
                <input
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  [checked]="column.visible"
                  [disabled]="column.required"
                  (change)="toggleColumn(column.key)">

                <span class="ml-3 text-sm text-gray-900">{{ column.label }}</span>
                @if (column.required) {
                  <span class="ml-auto text-xs text-gray-400">Requis</span>
                }
              </label>
            }
          </div>

          <div class="px-4 py-2 bg-gray-50 text-xs text-gray-500 rounded-b-lg">
            {{ getVisibleCount() }} / {{ getTotalCount() }} colonnes affichées
          </div>
        </div>
      }
    </div>
  `
})
export class TableColumnsManagerComponent {
  @Input({ required: true }) tableKey!: string;

  protected readonly columnsService = inject(TableColumnsService);
  protected readonly isOpen = signal(false);

  constructor() {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('app-table-columns-manager')) {
        this.isOpen.set(false);
      }
    });
  }

  toggleColumn(columnKey: string): void {
    this.columnsService.toggleColumn(this.tableKey, columnKey);
  }

  resetColumns(): void {
    this.columnsService.resetColumns(this.tableKey);
  }

  getVisibleCount(): number {
    return this.columnsService.getVisibleColumns(this.tableKey)().length;
  }

  getTotalCount(): number {
    return this.columnsService.getColumns(this.tableKey)().length;
  }
}