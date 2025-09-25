export interface Comment {
  id: number;
  todoId: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited?: boolean;
}

export interface CreateCommentDto {
  todoId: number;
  content: string;
}

export interface UpdateCommentDto {
  content: string;
}