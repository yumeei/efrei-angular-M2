import { Injectable, signal, computed } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TableColumnsService {
  private readonly storageKey = 'table-columns-config';

  private readonly defaultConfigs: Record<string, TableColumn[]> = {
    users: [
      { key: 'name', label: 'Utilisateur', visible: true, required: true },
      { key: 'email', label: 'Email', visible: true },
      { key: 'role', label: 'Rôle', visible: true },
      { key: 'actions', label: 'Actions', visible: true, required: true }
    ],
    todos: [
      { key: 'title', label: 'Ticket', visible: true, required: true },
      { key: 'status', label: 'Statut', visible: true },
      { key: 'priority', label: 'Priorité', visible: true },
      { key: 'assignedTo', label: 'Assigné à', visible: true },
      { key: 'deadline', label: 'Échéance', visible: true },
      { key: 'comments', label: 'Commentaires', visible: true },
      { key: 'description', label: 'Description', visible: false },
      { key: 'actions', label: 'Actions', visible: true, required: true }
    ]
  };

  private readonly _columnsConfig = signal<Record<string, TableColumn[]>>({});

  constructor() {
    this.loadConfiguration();
  }

  getVisibleColumns(tableKey: string) {
    return computed(() => {
      const config = this._columnsConfig();
      const columns = config[tableKey] || this.defaultConfigs[tableKey] || [];
      return columns.filter(col => col.visible);
    });
  }

  getColumns(tableKey: string) {
    return computed(() => {
      const config = this._columnsConfig();
      return config[tableKey] || this.defaultConfigs[tableKey] || [];
    });
  }

  toggleColumn(tableKey: string, columnKey: string): void {
    this._columnsConfig.update(config => {
      const tableConfig = config[tableKey] || [...(this.defaultConfigs[tableKey] || [])];
      const updatedConfig = tableConfig.map(col =>
        col.key === columnKey && !col.required
          ? { ...col, visible: !col.visible }
          : col
      );

      const newConfig = { ...config, [tableKey]: updatedConfig };
      this.saveConfiguration(newConfig);
      return newConfig;
    });
  }

  resetColumns(tableKey: string): void {
    this._columnsConfig.update(config => {
      const newConfig = {
        ...config,
        [tableKey]: [...(this.defaultConfigs[tableKey] || [])]
      };
      this.saveConfiguration(newConfig);
      return newConfig;
    });
  }

  private loadConfiguration(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const mergedConfig: Record<string, TableColumn[]> = {};

        Object.keys(this.defaultConfigs).forEach(tableKey => {
          const defaultCols = this.defaultConfigs[tableKey];
          const savedCols = parsed[tableKey] || [];

          const savedColsMap = new Map(savedCols.map((col: TableColumn) => [col.key, col]));

          mergedConfig[tableKey] = defaultCols.map(defaultCol => {
            const savedCol = savedColsMap.get(defaultCol.key);
            return savedCol ? { ...defaultCol, ...savedCol } : defaultCol;
          });
        });

        this._columnsConfig.set(mergedConfig);
      } else {
        this._columnsConfig.set({ ...this.defaultConfigs });
      }
    } catch (error) {
      this._columnsConfig.set({ ...this.defaultConfigs });
      console.error(error);
    }
  }

  private saveConfiguration(config: Record<string, TableColumn[]>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving table columns configuration:', error);
    }
  }
}