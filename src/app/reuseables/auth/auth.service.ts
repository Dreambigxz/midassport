import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { ConfirmationDialogService } from '../modals/confirmation-dialog/confirmation-dialog.service';

interface StoredToken {
  created: string;  // ISO string
  exp: string;      // ISO string
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private reqConfirmation = inject(ConfirmationDialogService)

  public tokenKey = 'token';
  public isLoggedIn = false;
  public redirectUrl: string | null = null;
  public token: string | null = null;

  private addHours(date: Date, hours: number): Date {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  }

  /** ✅ Checks if user is logged in and token still valid */
  checkLogin(): boolean {
    const raw = localStorage.getItem(this.tokenKey);

    console.log({raw});

    if (!raw) {
      this.isLoggedIn = false;
      return false;
    }

    try {
      const stored: StoredToken = JSON.parse(raw);
      const exp = new Date(stored.exp);
      const now = new Date();

      if (now >= exp) {
        this.logout_now(); // Expired
        return false;
      }

      this.token = stored.token
      this.isLoggedIn = true;
      return true;
    } catch (e) {
      console.error('Invalid token in storage', e);
      this.logout_now();
      return false;
    }
  }

  /** ✅ Save login and token */
  login(token: string): Observable<boolean> {
    const payload: StoredToken = {
      created: new Date().toISOString(),
      exp: this.addHours(new Date(), 48).toISOString(),
      token,
    };

    localStorage.setItem(this.tokenKey, JSON.stringify(payload));
    this.isLoggedIn = true;
    return of(true);
  }

  /** ✅ Get current token if logged in */
  getToken(): string | null {
    if (this.checkLogin()) {
      const raw = localStorage.getItem(this.tokenKey);
      return raw ? JSON.parse(raw).token : null;
    }
    return null;
  }

  /** ✅ Force logout */
  logout_now(): void {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedIn = false;
    window.location.reload();
  }

  /** ✅ Optional logout with confirmation */
  logout(force = true): void {
    if (force) {
      this.logout_now();
    } else {
      this.reqConfirmation.confirmAction(
        ()=>{this.logout_now()},
        'Logout',
        'Are you sure you want to logout account ?'
      )
    }
  }
}
