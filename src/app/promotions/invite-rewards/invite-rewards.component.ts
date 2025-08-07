import { Component,inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { RequestDataService } from '../../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../../reuseables/http-loader/store-data.service';
import { ToastService } from '../../reuseables/toast/toast.service';
import { SpinnerComponent } from '../../reuseables/http-loader/spinner.component';
import {  loadScript } from '../../reuseables/helper';

import { LoaderService } from '../../reuseables/http-loader/loader.service';

@Component({
  selector: 'app-invite-rewards',
  imports: [CommonModule,RouterLink,SpinnerComponent],
  templateUrl: './invite-rewards.component.html',
  styleUrl: './invite-rewards.component.css'
})
export class InviteRewardsComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  route = inject(ActivatedRoute)
  loaderService = inject(LoaderService)


  window = window
  parseInt=parseInt
  diretory:any
  table:any=[ ]

  ngOnInit(): void {

    loadScript('assets/js/main.js');
    if (!this.storeData.get('invite-rewards')) {
        this.reqServerData.get("invite-rewards?showSpinner").subscribe({
          next:(res)=>{
            // this.loaderService.show()
          }
        })
    }
  }

  getEarning(levelId: number): boolean {
    const earnedLevels = this.storeData.store['invite-rewards']?.earning_history || [];
    return earnedLevels.some((entry: any) => entry.level === levelId);
  }

  getProgress(level: any): number {
    const totalInvites = this.storeData.store['invite-rewards']?.total_invites || 0;

    if (this.getEarning(level.id)) {
      return 100; // completed level
    }

    const progress = (totalInvites / level.invites_required) * 100;
    return Math.min(progress, 100);
  }


}
