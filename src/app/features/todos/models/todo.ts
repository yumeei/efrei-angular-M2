export interface Todo {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  isOverdue?: boolean;
  daysUntilDeadline?: number;
}

export interface CreateTodoRequest {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assignedTo?: number;
}
