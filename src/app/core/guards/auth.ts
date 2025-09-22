import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.getCurrentUser();

  if (currentUser) {
    console.warn('currentUser true');
    return true; // access authorized
  } else {
    // redirect to login
    console.warn('currentUser false');
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false; // access denied
  }
};
