import { Component,inject, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { RequestDataService } from '../../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../../reuseables/http-loader/store-data.service';
import { ToastService } from '../../reuseables/toast/toast.service';
import { SpinnerComponent } from '../../reuseables/http-loader/spinner.component';
import {  loadScript , copyContent} from '../../reuseables/helper';

import { FormsModule, Validators } from '@angular/forms';

interface Transaction {
  type: 'Deposit' | 'Withdraw';
  status: 'Pending' | 'Completed' | 'Failed';
  date: string;
  amount: number;
}

@Component({
  selector: 'app-transactions',
  imports:[CommonModule,SpinnerComponent,FormsModule, RouterLink],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  route = inject(ActivatedRoute)

  window = window
  filter:any

  allTransactions: any = [
    // { type: 'Deposit', status: 'Completed', date: '2025-07-01', amount: 120 },
    // { type: 'Withdraw', status: 'Pending', date: '2025-07-05', amount: 50 },
    // { type: 'Deposit', status: 'Failed', date: '2025-07-10', amount: 200 },
    // { type: 'Withdraw', status: 'Completed', date: '2025-07-15', amount: 75 },
  ];

  filteredTransactions: any[] = this.allTransactions;
  selectedType: string = 'All';


  ngOnInit(): void {
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

    loadScript('assets/js/main.js');

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
    console.log('applyFilter');

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
}
