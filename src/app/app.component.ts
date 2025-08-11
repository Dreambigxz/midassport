import { Component,ViewChild,inject, ElementRef, AfterViewInit } from '@angular/core';
import { RouterOutlet, Router , NavigationEnd} from '@angular/router';
import { CommonModule } from '@angular/common';

import { RequestDataService } from './reuseables/http-loader/request-data.service';
import { StoreDataService } from './reuseables/http-loader/store-data.service';

import { loadScript } from './reuseables/helper';
import { filter } from 'rxjs/operators';

import { Modal } from 'bootstrap';

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}
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
  router=inject(Router)

  telegramUser: any;

  bindToken: string | null = null;
  joinLink: string | null = null;
  checking = false;
  joined = false;

  private lastTokenSent: string | null = null;


  // bindedTg

  isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }


  ngOnInit(): void {

    console.log('App');


    // ✅ Call this immediately when app starts
    this.requestNotificationPermission();

    this.showDownload()



    // if ('serviceWorker' in navigator) {
    //
    //
    //   navigator.serviceWorker.ready.then(registration => {
    //
    //     // registration.active?.postMessage({ // XXX: : 'TEST_NOTIFICATION' });
    //
    //     const tokenData = localStorage.getItem('token');
    //     if (tokenData) {
    //       const tokenObj = JSON.parse(tokenData);
    //       if (tokenObj?.token) {
    //         registration.active?.postMessage({
    //           type: 'SET_TOKEN',
    //           token: tokenObj.token
    //         });
    //       }
    //     }
    //   });
    // } else {
    //   alert('No Service Worker support');
    // }

    // Run after every route navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        console.log('📍 Route changed — checking bets');
        this.syncTokenWithSW()
      });


  }
  private async syncTokenWithSW() {

    if ('serviceWorker' in navigator) {
      // 1️⃣ Get your stored user token from local storage or an auth service
      const tokenData = localStorage.getItem('token');
      if (!tokenData) return;

      const tokenObj = JSON.parse(tokenData);


      // 2️⃣ Only send if the SW hasn't got this token yet
      if (this.lastTokenSent !== tokenObj.token) {
        const reg = await navigator.serviceWorker?.ready;
        if (reg.active) {
          reg.active.postMessage({
            type: 'SET_TOKEN',
            token: tokenObj.token
          });
          console.log('🔄 Token sent to SW:', tokenObj.token);
          this.lastTokenSent = tokenObj.token;
        }
      }
    }

  }

  showDownload(){
      if (this.isIOS()) {
       // iOS + Safari browser
       /* show user the guiid on add to home  if the pwa app has not been installed*/
      } else {
       // Android or desktop
       window.addEventListener('beforeinstallprompt', (event) => {
           event.preventDefault();
           this.storeData.store['installPromptEvent'] = event;
           this.storeData.store['can_download_app']=true
       });
     }
  }

  async requestNotificationPermission() {
    if (!('Notification' in window)) return;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
    }
  }

  // ngAfterViewInit(){}





}
