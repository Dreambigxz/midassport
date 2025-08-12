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

  checkOpenBetInterval: number | null= null

  private lastTokenSent: string | null = null;
  private openBet: string | null = null;


  isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }


  ngOnInit(): void {

    // ✅ Call this immediately when app starts
    this.requestNotificationPermission();
    this.showDownload()

    // Run after every route navigation
    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(() => {this.syncTokenWithSW()});

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

      setTimeout(async() => {
        if (!this.openBet) {
          const reg = await navigator.serviceWorker?.ready;

          this.openBet = this.storeData.get('betDir')?.ticket?.filter((bet: any) =>
            bet.status === 'open'
          )
          this.openBet?.length?reg.active?.postMessage({ type: 'UPDATE_BETS', bets:this.openBet }):0;
        }
        console.log("openBet>>", this.openBet);

        if (this.openBet?.length&&!this.checkOpenBetInterval) {
          this.checkOpenBetInterval=setInterval(this.startForeGround, 60 * 1000)
          this.registerPeriodicSync("check-open-bets")
        }else{
          this.unRegisterPeriodicSync("check-open-bets")
        }
      }, 3000);
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

  async registerPeriodicSync(name:any) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if ('periodicSync' in reg) {
          console.log('✅ Periodic Sync supported');
          await reg.periodicSync?.register(name, { minInterval: 15 * 60 * 1000 });
          console.log('[App] Periodic sync registered - '+name, '\n', new Date().toLocaleString());
        } else {
          console.log('❌ Periodic Sync NOT supported');
        }
      } catch (err) {
        console.error('Periodic Sync registration failed:', err);
      }
  }

  async unRegisterPeriodicSync(name:any){
      const reg = await navigator.serviceWorker.ready;
      if ('periodicSync' in reg) {
        try {
          await reg.periodicSync?.unregister(name);
          console.log(`🛑 Periodic sync ${name} unregistered`);
        } catch (err) {
          console.error('Failed to unregister periodic sync:', err);
        }
      }
  }

  async startForeGround(){
    console.log('[App] Foreground bet check triggered');
    const bets = this.storeData.store['betDir']?.ticket?.filter((bet: any) => bet.status === 'open');
    console.log({bets});
    if (bets?.length) {
      const reg = await navigator.serviceWorker?.ready;
      reg.active?.postMessage({ type: 'check-open-bets'});
    }else{this.checkOpenBetInterval?clearInterval(this.checkOpenBetInterval):0;}
  }

}
