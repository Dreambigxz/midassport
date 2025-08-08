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

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        this.storeData.store['installPromptEvent'] = event;
        this.storeData.store['can_download_app']=true

        // Show your custom install button
        // this.showInstallButton = true;
        // console.log('CANINSTALL');

    });

  }

  ngAfterViewInit(){
    // if (!this.storeData.get('wallet')) {
    //   this.reqServerData.get('main/').subscribe({
    //     next: res => {
    //       console.log('GOT RES>><<', res);
    //       // console.log(this.storeData.store);
    //
    //     }
    //   });
    // }
  }





}
