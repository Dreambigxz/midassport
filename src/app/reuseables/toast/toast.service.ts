import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastComponent } from './toast.component';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  show(body:any) {
  // show(message: string, status: 'success' | 'error' = 'success') {
    this.snackBar.openFromComponent(ToastComponent, {
      data: { message:body.message, status:body.status },
      duration: 6000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['transparent-snackbar'] // Optional global style
    });
  }
}
