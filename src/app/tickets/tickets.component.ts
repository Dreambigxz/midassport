import { Component,inject } from '@angular/core';
import { CommonModule } from '@angular/common';


import { RequestDataService } from '../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../reuseables/http-loader/store-data.service';
import { ConfirmationDialogService } from '../reuseables/modals/confirmation-dialog/confirmation-dialog.service';
import { SpinnerComponent } from '../reuseables/http-loader/spinner.component';

import { onScroll, loadMore, padNum, loadScript, dateDiff } from '../reuseables/helper';

type TicketCategory = 'won' | 'loss' | 'cancel' | 'open'  | 'postponed'
type recordskey = 'true'|'false'

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

import { FormsModule } from '@angular/forms';

import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-tickets',
  imports: [
    CommonModule,SpinnerComponent,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    FormsModule,
    RouterLink,

  ],
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.css'
})
export class TicketsComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  reqConfirmation = inject(ConfirmationDialogService)


  window=window
  parseInt = parseInt
  current ='ticket'

  ticket:any; activeTicket=0
  categorizeTicketData: Record<TicketCategory, any> = {
    won:[],
    loss:[],
    cancel:[],
    postponed:[],
    open:[],

  }

  now = new Date()
  dateFrom:any
  sevenDaysAgo=new Date()
  dateTo=this.now.toISOString().split('T')[0]
  records:Record<recordskey, any> ={
    'false':{ //risk game
      won:{
        count:0,
        amount:0
      },
      loss:{
        count:0,
        amount:0
      }
    },
    'true':{ //company Game
      won:{
        count:0,
        amount:0
      },
      loss:{
        count:0,
        amount:0
      }
    }
  }

  ngOnInit(): void {
      loadScript('assets/js/main.js');

      this.sevenDaysAgo.setDate(this.now.getDate() - 7);
      this.dateFrom = this.sevenDaysAgo.toISOString().split('T')[0]

      console.log("betDir", this.storeData.get('betDir'));

      if (!this.storeData.get('betDir')||!this.storeData.get('betDir').ticket) {
        this.reqServerData.get('bet/?showSpinner').subscribe({
          next: res => this.categorizeTicket()
        })
      }
      else{
        this.categorizeTicket()
    };
//
  }

  categorizeTicket(){

    if (this.storeData.get('betDir')['records']) {Object.keys(this.storeData.get('betDir')['records']).forEach(k => {this.records[k as recordskey] = {...this.records[k as recordskey],...this.storeData.get('betDir')['records'][k]}})}

    this.ticket = this.storeData.get('betDir')['ticket']
    Object.keys(this.categorizeTicketData).forEach((k:any) => {
      this.categorizeTicketData[k as TicketCategory]=this.ticket?.filter((t:any) => {
        return  t.status === k;
      });
    });

    try {
      this.categorizeTicketData['postponed' as TicketCategory] = [...this.categorizeTicketData.postponed,...this.categorizeTicketData.cancel]

    } catch (error) {}

  }

  PotentialWinning(stake_amount:any,market_odds:any,status:any){
    let res = 0
    if (['won','open'].includes(status)) {
      res = (market_odds*stake_amount/100 +stake_amount).toFixed(2)
    }
    return res
  }

  CanCancel(ticket:any){
    const now = new Date()
    return ticket.status==='open'&&new Date(ticket.start_date)>now
  }

  CancelTicket(ticket:any){
    this.reqConfirmation.confirmAction(()=>{
      this.reqServerData.post('bet/?showSpinner',{ticket_id:ticket.ticket_id,processor:'cancel_bet'}).subscribe({
        next: res =>{
           this.categorizeTicket();
           console.log({res});

           if ('serviceWorker' in navigator && res.status === "success") {
             navigator.serviceWorker.ready.then(registration => {
               const bets = res.main.betDir.ticket.filter((bet: any) =>
                 bet.status === 'open'
               )

               // Send bets to the active SW
               if (registration.active) {
                 registration.active.postMessage({ type: 'removeBetFromDB', betId:ticket.id });
                 console.log('Sent bets to service worker');
               }
             });
           }

         }
      })
    }, "Delete" , "Are you sure you want to cancel this ticket ?")

  }

  setTime(timestamp:any){
    const startDate = new Date(timestamp*1000)
    const ampm = startDate.getHours() >= 12 ? 'PM' : 'AM';

    let result = `${padNum(startDate.getHours())}:${padNum(startDate.getMinutes())} ${ampm}`
    return result
  }

  filterByDate() {
    const start = new Date(this.dateFrom);
    const stop = new Date(this.dateTo);
    this.reqServerData.post('bet/?showSpinner',{start,stop,processor:'update_main'}).subscribe({
      next: res => this.categorizeTicket()
    })

  }

}
