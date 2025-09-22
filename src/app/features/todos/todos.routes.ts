import { Routes } from '@angular/router';
import { TodoListComponent } from './components/todo-list';

export const TODOS_ROUTES: Routes = [
  {
    path: '',
    component: TodoListComponent,
  },
];
