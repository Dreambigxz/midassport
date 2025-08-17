import { Component , inject} from '@angular/core';
import { CommonModule } from '@angular/common';

import { RequestDataService } from '../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../reuseables/http-loader/store-data.service';
import { SpinnerComponent } from '../reuseables/http-loader/spinner.component';

import { loadScript } from '../reuseables/helper';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule,SpinnerComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);

  ngOnInit(){

    loadScript('assets/js/main.js');

    if (!this.storeData.get('notifications')) {
      this.reqServerData.get('notifications/').subscribe({
        next:res=>{
          console.log(res);

        }
      })
    }

  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  markAsRead(item: any) {
    // move from unseen → seen
    this.storeData.get('notification').seen.unshift(item);
    this.storeData.get('notification').unseen = this.storeData.get('notification').unseen.filter((n: any) => n.txref !== item.txref);
  }

}
