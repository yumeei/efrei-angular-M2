import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth';
import { adminGuard } from './core/guards/admin';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/todos',
    pathMatch: 'full',
  },
  {
    path: 'todos',
    canActivate: [authGuard], // Protection par authentification
    loadChildren: () => import('./features/todos/todos.routes').then((m) => m.TODOS_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard], // Protection admin
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
];
