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

    // ✅ Call this immediately when app starts
    this.requestNotificationPermission();

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        this.storeData.store['installPromptEvent'] = event;
        this.storeData.store['can_download_app']=true
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({ type: 'TEST_NOTIFICATION' });

        const tokenData = localStorage.getItem('token');
        if (tokenData) {
          const tokenObj = JSON.parse(tokenData);
          if (tokenObj?.token) {
            registration.active?.postMessage({
              type: 'SET_TOKEN',
              token: tokenObj.token
            });
          }
        }

      });
    } else {
      console.warn('No Service Worker support');
    }


  }

  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert('✅ Notification permission granted');
    } else {
      alert('❌ Notification permission denied');
    }
}

  // ngAfterViewInit(){}





}
