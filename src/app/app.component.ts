import { Component,ViewChild,inject, ElementRef, AfterViewInit } from '@angular/core';
import { RouterOutlet, Router , NavigationEnd} from '@angular/router';
import { CommonModule } from '@angular/common';

import { RequestDataService } from './reuseables/http-loader/request-data.service';
import { StoreDataService } from './reuseables/http-loader/store-data.service';

import { loadScript } from './reuseables/helper';
import { filter } from 'rxjs/operators';

import { Modal } from 'bootstrap';
import { PushNotificationService } from './reuseables/push-notification.service';

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
  pushService= inject(PushNotificationService)


  telegramUser: any;

  bindToken: string | null = null;
  joinLink: string | null = null;
  checking = false;
  joined = false;
  subscribed = false;

  checkOpenBetInterval: number | null= null
  siteName='MIDAS SPORT⚽️'
  private lastTokenSent: string | null = null;
  private openBet: string | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;

  isIOS(): boolean {
   return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  }

  isInStandaloneMode(): boolean {
    return (window.matchMedia('(display-mode: standalone)').matches) ||
           ((navigator as any).standalone === true);
  }

  ngOnInit(): void {

    // Run after every route navigation
    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(() => {this.syncTokenWithSW()});

  }

  private async syncTokenWithSW() {

    this.showDownload();

    if ('serviceWorker' in navigator) {

      // 1️⃣ Get your stored user token from local storage or an auth service
      const tokenData = localStorage.getItem('token');
      if (!tokenData) return;

      const tokenObj = JSON.parse(tokenData);
      this.swRegistration = await navigator.serviceWorker.ready;

      // 2️⃣ Only send if the SW hasn't got this token yet
      if (this.lastTokenSent !== tokenObj.token) {
        // const reg = await navigator.serviceWorker?.ready;
        if (this.swRegistration.active) {
          this.swRegistration.active.postMessage({
            type: 'SET_TOKEN',
            token: tokenObj.token
          });
          console.log('🔄 Token sent to SW:', tokenObj.token);
          this.lastTokenSent = tokenObj.token;
        }
      }

      setTimeout(async() => {
        await this.requestNotificationPermission();
        this.clientNotification()
      }, 1000);
    }

  }

  showDownload(){

      if (this.isIOS() && !this.isInStandaloneMode()) {
        this.storeData.set('installIOS',true)
        this.storeData.set('device','IOS')

      } else {
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.storeData.set('installPromptEvent',event)
            this.storeData.set('can_download_app',true)
            this.storeData.set('device','Android')
        });
    }
  }

  async requestNotificationPermission() {

    if (!('Notification' in window)){this.storeData.set('disabledNotification',true);return}


    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      if(localStorage.getItem('pushedNotification')) return;

      await this.pushService.init()
      this.subscribed = await this.pushService.isSubscribed();
      if (!this.subscribed) {await this.pushService.subscribeUser()}

      localStorage.setItem('pushedNotification', 'true')

    }else{
      // this.storeData.set('disabledNotification',true)
    }
  }

  async registerPeriodicSync(name:any) {
      try {
        // const reg = await navigator.serviceWorker.ready;
        if (this.swRegistration&&'periodicSync' in this.swRegistration) {
          const tags = await this.swRegistration?.periodicSync?.getTags();
          if (!tags?.includes(name)) {
            await this.swRegistration.periodicSync?.register(name, { minInterval: 15 * 60 * 1000 });
            console.log('[App] Periodic sync registered - '+name, '\n', new Date().toLocaleString());
          }
        }
      } catch (err) {
        console.error('Periodic Sync registration failed:', err);
      }
  }

  async unRegisterPeriodicSync(name:any){
      // const reg = await navigator.serviceWorker.ready;
      if (this.swRegistration&&'periodicSync' in this.swRegistration) {
        try {
          const tags = await this.swRegistration.periodicSync?.getTags();
          if (tags?.includes(name)) {
            await this.swRegistration.periodicSync?.unregister(name);
            console.log(`🛑 Periodic sync ${name} unregistered`);
          }
        } catch (err) {
          console.error('Failed to unregister periodic sync:', err);
        }
      }
  }

  clientNotification(){
    let clientAction = localStorage.getItem("clientAction")
    if(!clientAction)return
    let notify;
    if (clientAction==='register') {
      notify ={header: `📨Welcome to ${this.siteName}!`,body:"Your registration was successful ✅"}
    }else if(clientAction==='login'){
      notify ={header: `Welcome back!"`,body:"You're now logged in ✅"}
    }

    this.swRegistration?.active?.postMessage({ type: 'showNotification', notify })

    delete(localStorage['clientAction'])
  }

  onCurrencyChange(event: Event) {
    const selectedCode = (event.target as HTMLSelectElement).value;
    console.log("Selected Currency Code:", selectedCode);

    // Example: store it in walletData or trigger an API call
    // const selectedCurrency = this.walletData.init_currencies.find(c => c.code === selectedCode);
    // console.log("Selected Currency Object:", selectedCurrency);
  }


}
