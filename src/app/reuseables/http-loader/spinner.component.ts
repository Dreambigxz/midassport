import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoaderService } from './loader.service';
import { Observable, of} from 'rxjs';

// <div class="spinner"></div>
@Component({
  selector: 'app-spinner',
  imports: [ CommonModule],

  template: `
    <div *ngIf="isLoading | async" class="spinner-overlay">

      <div class="logo-container">
          <img src="assets/img/logo.png" alt="App Logo" class="logo-bounce" />
        </div>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.3); z-index: 1000;
    }
    .spinner {
      // background: white; padding: 20px; border-radius: 8px;
    }
  `]
})
export class SpinnerComponent {
    isLoading: Observable<boolean>;
   constructor(private loaderService: LoaderService) {
     this.isLoading = this.loaderService.loading$; // ✅ safe
   }

}
