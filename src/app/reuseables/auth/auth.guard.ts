import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Store intended redirect only if not already on login
  if (state.url !== '/login') {
    localStorage.setItem('redirectUrl', state.url);
  }

  if (authService.checkLogin()) {
    return true;
  }


  // Redirect to login
  return router.createUrlTree(['/login']);
};
