import { Component,inject, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { RequestDataService } from '../../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../../reuseables/http-loader/store-data.service';
import { ToastService } from '../../reuseables/toast/toast.service';
import { SpinnerComponent } from '../../reuseables/http-loader/spinner.component';
import {  loadScript , copyContent, padNum} from '../../reuseables/helper';

import { FormsModule, Validators } from '@angular/forms';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

interface Transaction {
  type: 'Deposit' | 'Withdraw';
  status: 'Pending' | 'Completed' | 'Failed';
  date: string;
  amount: number;
}

@Component({
  selector: 'app-transactions',
  imports:[
    CommonModule,SpinnerComponent,
    FormsModule, RouterLink,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
  ],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  route = inject(ActivatedRoute)

  window = window
  filter:any

  allTransactions: any = [];

  filteredTransactions: any[] = this.allTransactions;
  selectedType: string = 'All';



  ngOnInit(): void {

    loadScript('assets/js/main.js');

    this.route.paramMap.subscribe(params => {
      this.filter = params.get('filter');
      this.filter?this.selectedType=this.filter:0;
      if (true) {
          this.reqServerData.get("wallet?dir=start_transactions&showSpinner").subscribe({next: res =>
             {
               console.log({res});
               this.setData();
             }
           })
      }

    });

    this.sevenDaysAgo.setDate(this.now.getDate() - 7);
    this.dateFrom = this.sevenDaysAgo.toISOString().split('T')[0]

  }

  setData(): void {
    this.allTransactions = this.storeData.get('transactions')

    if (this.filter) {
      this.selectedType = this.filter.charAt(0) + this.filter.slice(1);
      this.applyFilter();
    } else {
      this.showAll();
    }
  }

  applyFilter() {

    if (this.selectedType === 'All') {
      this.filteredTransactions = this.allTransactions;
    } else {
      this.filteredTransactions = this.allTransactions.filter(
        (t:any) => t.type === this.selectedType
      );
    }
  }

  showAll() {
    this.selectedType = 'All';
    this.filteredTransactions = this.allTransactions;
  }

  now = new Date()
  dateFrom:any
  sevenDaysAgo=new Date()
  dateTo=this.now.toISOString().split('T')[0]

  setTime(timestamp:any){
    const startDate = new Date(timestamp*1000)
    const ampm = startDate.getHours() >= 12 ? 'PM' : 'AM';

    let result = `${padNum(startDate.getHours())}:${padNum(startDate.getMinutes())} ${ampm}`
    return result
  }

  filterByDate() {
    const start = new Date(this.dateFrom);
    const stop = new Date(this.dateTo);
    this.reqServerData.post('wallet/',{start,stop,processor:'filter_transactions'}).subscribe({
      next: res => {
        console.log({res});

        this.setData()
      }
    })

  }

  currencyConverter(amount:any){
    const payment_method = this.storeData.get('wallet').init_currency
    return amount * payment_method.rate
  }


}
