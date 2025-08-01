import { Component,inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { RequestDataService } from '../../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../../reuseables/http-loader/store-data.service';
import { ToastService } from '../../reuseables/toast/toast.service';
import { SpinnerComponent } from '../../reuseables/http-loader/spinner.component';
import {  loadScript } from '../../reuseables/helper';

@Component({
  selector: 'app-invite-rewards',
  imports: [CommonModule],
  templateUrl: './invite-rewards.component.html',
  styleUrl: './invite-rewards.component.css'
})
export class InviteRewardsComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  route = inject(ActivatedRoute)

  window = window
  parseInt=parseInt
  diretory:any
  table:any=[ ]

  ngOnInit(): void {

    loadScript('assets/js/main.js');
    if (!this.storeData.get('invite-rewards')) {
        this.reqServerData.get("invite-rewards?showSpinner").subscribe({next: res => {
          console.log(res);
        }})
    }
  }

  // getEarning(id:number){
  //   return this.storeData.get('invite-rewards').earning_history[id-1]
  // }

  getProgress(level: any): number {
    const totalInvites = this.storeData.store['invite-rewards'].total_invites || 0;

    console.log({totalInvites});

    // If already earned, show 100%
    if (this.getEarning(level.id-1)) {
      return 100;
    }

    // Show partial progress
    const progress = (totalInvites / level.invites_required) * 100;
    return Math.min(progress, 100);
  }

  getEarning(levelId: number): boolean {
    console.log({levelId});

    // Check if the user already earned this milestone
    const earnedLevels = this.storeData.store['invite-rewards']?.earning_history || [];
    console.log({earnedLevels});

    return earnedLevels[levelId]//.includes(levelId);
  }


}
