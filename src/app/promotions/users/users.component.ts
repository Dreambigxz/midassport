import { Component,inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { RequestDataService } from '../../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../../reuseables/http-loader/store-data.service';
import { ToastService } from '../../reuseables/toast/toast.service';
import { SpinnerComponent } from '../../reuseables/http-loader/spinner.component';
import {  loadScript } from '../../reuseables/helper';

@Component({
  selector: 'app-users',
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class PromotionUsersComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  route = inject(ActivatedRoute)

  window = window
  diretory:any
  table:any=[ ]

  ngOnInit(): void {

    loadScript('assets/js/main.js');
    this.route.paramMap.subscribe(params => {
      this.diretory=params.get('level')
      console.log(this.diretory);
      if (!this.storeData.get('promotionLevel_'+this.diretory)) {
          this.reqServerData.get('promotions/?level='+this.diretory).subscribe({next: res => {
            console.log(res);

          }})
      }

    });
  }

  currencyConverter(amount:any){
    const payment_method = this.storeData.get('wallet').init_currency
    return amount * payment_method.rate
  }




}
