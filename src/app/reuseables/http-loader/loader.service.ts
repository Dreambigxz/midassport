import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  public _loading = new BehaviorSubject<boolean>(false);
  public loading$ = this._loading.asObservable();

  private _loadingButton = new BehaviorSubject<HTMLElement | null>(null);
  public loadingButton$ = this._loadingButton.asObservable();

  show() { this._loading.next(true); }
  hide() { this._loading.next(false); }

  setLoadingButton(button: HTMLElement | null) {
    this._loadingButton.next(button);
  }

  getLoadingButton() {
    return this.loadingButton$;
  }
}
