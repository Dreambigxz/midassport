import { Component,inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RequestDataService } from '../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../reuseables/http-loader/store-data.service';
import { SpinnerComponent } from '../reuseables/http-loader/spinner.component';
import { RouterLink, Router, RouterOutlet } from '@angular/router';
import { ToastService } from '../reuseables/toast/toast.service';

import {  loadScript, copyContent } from '../reuseables/helper';
import { CountdownPipe } from '../reuseables/pipes/countdown.pipe';
import { Observable, interval } from 'rxjs';
import { map, startWith } from 'rxjs/operators';



@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, RouterOutlet, CountdownPipe],
  templateUrl: './promotions.component.html',
  styleUrl: './promotions.component.css'
})
export class PromotionsComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  router = inject(Router)
  toast = inject(ToastService)


  window = window
  current = 'promotions'
  refLink:any

  ngOnInit(): void {
    loadScript('assets/js/main.js');
      if (!this.storeData.get('refDir')) {
        this.reqServerData.get('promotions/').subscribe({next: res => {
          this.makeRefLink()
          console.log({res});

        }})

    }else{this.makeRefLink()}
  }

  // makeRefLink(){
  //     const RefCode = this.storeData.get('refDir')['RefCode']
  //     this.refLink = window.location.host+'/register?RefCode='+RefCode
  // }

  makeRefLink() {
    const RefCode = this.storeData.get('refDir')['RefCode'];
    this.refLink = `${window.location.origin}/register?RefCode=${RefCode}`;
  }


  copyRefCode(){
    copyContent(this.toast,this.refLink,'Invite link copied!',)
  }

  navigate (url:any){
    this.router.navigate(url.split(' '))
  }

  currencyConverter(amount:any){
    const payment_method = this.storeData.get('wallet').init_currency
    return amount * payment_method.rate
  }

  nextWednesday(): Date {
    const now = new Date();
    const day = now.getDay(); // 0=Sunday, 3=Wednesday
    let daysUntilWednesday = (3 - day + 7) % 7;
    if (daysUntilWednesday === 0) daysUntilWednesday = 7; // always next, not today

    const nextWed = new Date(now);
    nextWed.setDate(now.getDate() + daysUntilWednesday);
    nextWed.setHours(0, 0, 0, 0);
    return nextWed;
  }

  countdown(target: Date): Observable<string> {
    return interval(1000).pipe(
      startWith(0),
      map(() => {
        const now = new Date().getTime();
        const diff = target.getTime() - now;

        if (diff <= 0) return "0d 0h 0m 0s";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
      })
    );
  }

  nextWednesdayCountdown$ = this.countdown(this.nextWednesday());


}
