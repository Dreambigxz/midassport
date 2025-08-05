// telegram-bonus.component.ts
import { Component, inject } from '@angular/core';import { CommonModule } from '@angular/common';
import { TelegramService } from '../reuseables/telegram-binder.service';
import { RequestDataService } from '../reuseables/http-loader/request-data.service';
import { Modal } from 'bootstrap';
import { StoreDataService } from '../reuseables/http-loader/store-data.service';


@Component({

  selector: 'app-telegram-bonus',
  imports:[CommonModule],
  templateUrl: './telegram-bonus.component.html'
})

export class TelegramBonusComponent {
  step = 1; // 1 = bind, 2 = wait for join link, 3 = check join
  joinLinkSent = false;
  joined = false;
  checking = false;
  joinLink=false

  telegram=inject(TelegramService)
  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  http = inject(RequestDataService)

  openModal() {
    const modalEl = document.getElementById('telegramBonusModal');
    if (modalEl) {
      new Modal(modalEl).show();
    }
  }




}
