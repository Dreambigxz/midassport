import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SpinnerComponent } from '../reuseables/http-loader/spinner.component';
import { RequestDataService } from '../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../reuseables/http-loader/store-data.service';

import { Router, RouterLink, NavigationEnd } from '@angular/router';
import {  loadScript, copyContent } from '../reuseables/helper';


@Component({
  selector: 'app-vip',
  imports: [CommonModule,SpinnerComponent],
  templateUrl: './vip.component.html',
  styleUrl: './vip.component.css'
})
export class VipComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  router = inject(Router);

  window=window

  @Input() streak: any;
  historyEntries: any[] = [];

  bonusLevels: Record<number, [number, string]> = {
    1: [0.10, "VIP1"],
    2: [0.20, "VIP2"],
    3: [0.30, "VIP3"],
    4: [0.40, "VIP4"],
    5: [0.50, "VIP5"],
    7: [0.60, "VIP6"],
    9: [0.70, "VIP7"],
    11: [0.80, "VIP8"],
    13: [0.90, "VIP9"],
    15: [1.00, "VIP10"],
    19: [1.50, "VIP11"],
    25: [2.00, "VIP12"]
  };

 ngOnInit() {

   if (!this.storeData.get("streak")) {
     this.reqServerData.get('main?streak=true/').subscribe({next: res => {
       console.log({res});
       this.streak = this.storeData.get("streak")
       this.historyEntries = Object.entries(this.streak.history)
        .reverse() // reverse the array of [day, data] first
        .map(([day, data]: any) => ({
          day,
          ...data
        }));

     }})
   }

   loadScript('assets/js/main.js');

 }

 getVipBadgeClass(vip: string): string {
   switch (vip) {
     case 'VIP0': return 'bg-dark';
     case 'VIP1': return 'bg-green';
     case 'VIP2': return 'bg-blue';
     case 'VIP3': return 'bg-purple';
     case 'VIP4': return 'bg-pink';
     case 'VIP5': return 'bg-yellow text-black';
     case 'VIP6': return 'bg-indigo';
     case 'VIP7': return 'bg-red';
     case 'VIP8': return 'bg-teal';
     case 'VIP9': return 'bg-orange';
     case 'VIP10': return 'bg-cyan text-black';
     case 'VIP11': return 'bg-lime text-black';
     case 'VIP12': return 'bg-emerald';
     default: return 'bg-gray';
   }
 }

 // optional progress percentage towards next VIP
 getProgressPercent(): number {
  if (!this.streak) return 0;

  const daysPlayed = this.streak.days_played || 0;

  // Sorted VIP thresholds
  const thresholds = Object.keys(this.bonusLevels)
    .map(k => parseInt(k))
    .sort((a, b) => a - b);

  // Find current and next VIP threshold
  let currentThreshold = 0;
  let nextThreshold = thresholds[thresholds.length - 1];

  for (let i = 0; i < thresholds.length; i++) {
    if (daysPlayed < thresholds[i]) {
      nextThreshold = thresholds[i];
      currentThreshold = i === 0 ? 0 : thresholds[i - 1];
      break;
    }
  }

  // Compute the gap and ensure it’s at least 1
  const gap = Math.max(1, nextThreshold - currentThreshold);
  const fraction = (daysPlayed - currentThreshold) / gap;

  // Set min/max progress to avoid instant jumps
  const minProgress = 5;   // bar starts at 5%
  const maxProgress = 95;  // bar stops at 95% until VIP is reached
  const progress = minProgress + fraction * (maxProgress - minProgress);

  // Clamp to [minProgress, maxProgress]
  return Math.min(maxProgress, Math.max(minProgress, progress));
}




 // currency convereter
 currencyConverter(amount:any){
   const payment_method = this.storeData.get('wallet').init_currency
   return amount * payment_method.rate
 }


}
