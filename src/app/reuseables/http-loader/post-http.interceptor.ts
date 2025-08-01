import { HttpInterceptorFn, HttpResponse, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, tap } from 'rxjs';

import { LoaderService } from './loader.service';
import { StoreDataService } from './store-data.service';
import { StatusDialogComponent } from '../status-dialog/status-dialog.component';
import { ToastService } from '../toast/toast.service';
import { AuthService } from '../auth/auth.service';

import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogService } from '../modals/confirmation-dialog/confirmation-dialog.service';
import { Router } from '@angular/router';

export const PostHttpInterceptor: HttpInterceptorFn = (req, next) => {

  const loaderService = inject(LoaderService);
  const storeData = inject(StoreDataService);
  const dialog = inject(MatDialog);
  const toast = inject(ToastService);
  const reqConfirmation = inject(ConfirmationDialogService);
  const router = inject(Router);
  const authService = inject(AuthService);

  // 🔑 Ensure we always check login before sending
  authService.checkLogin();

  // Add token header if logged in
  let headers = req.headers || new HttpHeaders();
  if (authService.isLoggedIn && authService.token) {
    headers = headers.set('Authorization', `Token ${authService.token}`);
  }

  // Clone request with updated headers
  req = req.clone({ headers });

  const isPost = req.method === 'POST';

  if (req.url.includes('showSpinner')) {
    loaderService.show();
  }
  if (isPost) {
    const activeBtn = document.activeElement as HTMLElement;
    loaderService.setLoadingButton(activeBtn);
  }

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          let body;
          if (event.body && typeof event.body === 'object' && !Array.isArray(event.body)) {
            body = event.body as { message?: string; status?: string; main?: Object; next_page?: any };
            body.message ? toast.show(body) : 0;
            body.main ? storeData.setMultiple(body.main) : 0;
            if (body.next_page) {
              const next_page_ = body.next_page.url;
              reqConfirmation?.confirmAction(
                (next_page: any = next_page_) => { router.navigate([next_page]); },
                body.next_page.title,
                body.next_page.message
              );
            }
          }
        }
      },
      error: (err) => {
        if (err.status === 401 || err.statusText === 'Unauthorized') {
          authService.logout(true);
        } else {
          dialog.open(StatusDialogComponent, {
            data: { title: 'Error', message: 'Request failed!', status: 'error' }
          });
        }
      }
    }),
    finalize(() => {
      loaderService.setLoadingButton(null);
      loaderService.hide();
    })
  );
};
