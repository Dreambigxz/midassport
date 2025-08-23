import { Component,inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RequestDataService } from '../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../reuseables/http-loader/store-data.service';
import { SpinnerComponent } from '../reuseables/http-loader/spinner.component';
import { RouterLink, Router, RouterOutlet } from '@angular/router';
import { ToastService } from '../reuseables/toast/toast.service';

import {  loadScript, copyContent } from '../reuseables/helper';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, RouterOutlet],
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


}
