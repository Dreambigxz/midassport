import { Component, inject, ViewChild, ElementRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';

import { ApiService } from "../api/api.service";
import { AuthService } from "../auth/auth.service";
import { DataService } from "../user/data.service";

import { MatDialog } from '@angular/material/dialog';

import { timeSince, copyContent, quickMessage } from '../../helper';
import { SimpleDialogComponent } from "../simple-dialog/simple-dialog.component";

@Component({
  selector: 'app-payment-confirmation',
  imports: [CommonModule],
  templateUrl: './payment-confirmation.component.html',
  styleUrl: './payment-confirmation.component.css'
})
export class PaymentConfirmationComponent {


  constructor(

    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    public quickMessage: quickMessage,

  ) {}

  @ViewChild('viewInfo') viewInfo!: ElementRef<HTMLInputElement>;

  history = window.history
  directory = 'confirmation'
  isLoadingContent=false

  serviceData = inject(DataService)
  apiService = inject(ApiService)
  authService = inject(AuthService)

  configuration ={
    name:{
      'weputaago':'withdraw',
      'tiyeago':'deposit'
    }
  }

  totalAmount = 0
  totalAmountDollar=0
  currencySymbol = ''

  username = (this.serviceData.userData as any).username

  ngOnInit():void{
    let req_data = this.route.snapshot.queryParamMap.get('page')
    let method = this.route.snapshot.queryParamMap.get('method')
    !req_data?req_data='deposit':0;
    this.isLoadingContent = true

    let url = 'confirmation'+window.location.search

    this.apiService.tokenData(url, this.authService.tokenKey,'get', {})
    .subscribe(response => {
      console.log({response});

      this.serviceData.update(response)
      this.username=response.username
      this.isLoadingContent = false
      this.directory=response.type
      this.transaction=response.table
      this.currencySymbol=response.symbol
      this.totalAmount=response.total_amount
      this.totalAmountDollar=response.total_amount_usd
    }, error=>{
      this.isLoadingContent = false
    }
  )

  }

  transaction:any

  TransactionHandler(transaction:any,status:any) {
    console.log({transaction,status});

    const dialogRef = this.dialog.open(SimpleDialogComponent,{data:{message:"Are you sure you want to continue?",header:status, color:status==='success'?'green':'red',confirmation:true},})
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoadingContent=true
        this.apiService.tokenData('confirmation/', this.authService.tokenKey,'post', {action:status,id:transaction.id})
        .subscribe(response => {
          this.isLoadingContent=false;
          transaction.status = status;
          this.totalAmount-= transaction.amount
          this.totalAmountDollar -= transaction.init_amount

          let dialogRef = this.dialog.open(SimpleDialogComponent,{data:{message:response.message,header:response.header,color:response.success?'green':'red'}})

        }, error =>{
          this.isLoadingContent=false
          if (error.statusText === "Unauthorized") {this.authService.logout()}else{
            this.dialog.open(SimpleDialogComponent,{
              data:{message:"Unable to process request, please try again",header:'Request timeout!', color:'red'}
            })
          }
        });
      }
    });

  }

  timeSince = timeSince

  openDetails(tra:any,cls:any){
    let element=document.querySelector('.'+cls[0])
    let detailBtn=document.querySelector('.'+cls[1])
    if (element) {
      element.classList.remove('hide')
      detailBtn?.classList.add('hide')
    }


  }

  extraField(tra:any,type:any){

    let  data = JSON.parse(tra.extraField)
    if (type==='bank'){
      return data[type].text
    }

    return data[type]
  }

  copyContent = copyContent

  previewVisible = false;

  openPreview() {
    this.previewVisible = true;
  }

  closePreview() {
    this.previewVisible = false;
  }

}
