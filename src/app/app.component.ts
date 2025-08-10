import { Component,ViewChild,inject, ElementRef, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { RequestDataService } from './reuseables/http-loader/request-data.service';
import { StoreDataService } from './reuseables/http-loader/store-data.service';

import { loadScript } from './reuseables/helper';

import { Modal } from 'bootstrap';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {

  title = 'fbapp';

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);

  telegramUser: any;

  bindToken: string | null = null;
  joinLink: string | null = null;
  checking = false;
  joined = false;

  // bindedTg


  ngOnInit(): void {

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        this.storeData.store['installPromptEvent'] = event;
        this.storeData.store['can_download_app']=true
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        const bets = [
          { id: 1, startTime: '2025-08-10T15:00:00Z', notified: false },
          { id: 2, startTime: '2025-08-10T15:30:00Z', notified: false }
        ];

        // Send bets to the active SW
        if (registration.active) {
          registration.active.postMessage({ type: 'UPDATE_BETS', bets });
          console.log('Sent bets to service worker');
        }
      });
    }else{
      console.log("NO SERVICE WORKER");

    }
  }

  // ngAfterViewInit(){}





}
