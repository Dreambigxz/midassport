import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of} from 'rxjs';

import { ApiService } from "../api/api.service";
import { AuthService } from "../auth/auth.service";
import { DataService } from "../user/data.service";

import { onScroll, loadMore } from '../../helper';

@Component({
  selector: 'app-notification-page',
  imports: [
    CommonModule
  ],
  templateUrl: './notification-page.component.html',
  styleUrls: ['./notification-page.component.css']
})
export class NotificationPageComponent implements OnInit {

  serviceData = inject(DataService)
  apiService = inject(ApiService)
  authService = inject(AuthService)

  AllData=this.serviceData.userData;

  directory!:string

  loading=false
  isLoadingContent = false
  history = window.history

  notifications = (this.serviceData.userData as any).notification //any[] = [];
  ObjectiveList: { [key: string]: any } = {};
  totalNotUnread = (this.serviceData.userData as any).totalNotUnread


  ngOnInit(): void {

    if (!this.notifications) {
      this.isLoadingContent = true
      this.apiService.tokenData('notification/', this.authService.tokenKey,'get',{}).subscribe({
        next: (response) => {
          this.isLoadingContent = false
          this.serviceData.update(response);
          this.notifications = response.notification
          Object.values(response.notification.unseen).map((v)=>this.markAsUnRead(v))
          this.notifications=[...response.notification.unseen, ...response.notification.seen]
          // this.display=this.notifications

          this.loadData.data=this.notifications
          loadMore(this.loadData)
          this.display=this.loadData.displayedItems
        },
        error: (err) => {
          if (err.statusText === "Unauthorized") {this.authService.logout(true)}
        }
      });
    }else{
      this.notifications=[...this.notifications.unseen, ...this.notifications.seen]

      this.loadData.data=this.notifications
      loadMore(this.loadData)
      this.display=this.loadData.displayedItems


    }

  }

  markAsRead(notification: any) {
    notification.unread = false;
    (this.serviceData.userData as any).totalNotUnread-=1

  }
  markAsUnRead(notification: any){notification.unread = true;}

  timeSince(dateStr: string): string {
    const date = new Date(dateStr);
    const seconds = Math.floor((+new Date() - +date) / 1000);

    const intervals: { [key: string]: number } = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };

    for (let key in intervals) {
      const interval = Math.floor(seconds / intervals[key]);
      if (interval >= 1) return `${interval} ${key}${interval > 1 ? 's' : ''} ago`;
    }
    return 'just now';
  }

  display: any [] = []

  loadData  = {
    displayedItems:[],
    batchSize: 6,
    currentIndex : 0,
    data:this.notifications
  }


  onScroll(event: any) {

    this.loadData.data=this.notifications//&&this.notifications.unseen?[...this.notifications.unseen, ...this.notifications.seen]:this.notifications
    onScroll(event,this.loadData)
    this.display= this.loadData.displayedItems
    // console.log({'this.display':this.display});

  }

}
