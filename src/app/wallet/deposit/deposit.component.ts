import { Component,inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { RequestDataService } from '../../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../../reuseables/http-loader/store-data.service';
import { ToastService } from '../../reuseables/toast/toast.service';
import { SpinnerComponent } from '../../reuseables/http-loader/spinner.component';
import {  loadScript , copyContent} from '../../reuseables/helper';

import { FormHandlerService } from '../../reuseables/http-loader/form-handler.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { ConfirmationDialogService } from '../../reuseables/modals/confirmation-dialog/confirmation-dialog.service';

import { QRCodeComponent } from 'angularx-qrcode';

type PaymentMethodGrp = 'Local'|'Crypto'

@Component({
  selector: 'app-deposit',
  imports: [CommonModule,SpinnerComponent,ReactiveFormsModule,QRCodeComponent],
  templateUrl: './deposit.component.html',
  styleUrl: './deposit.component.css'
})
export class DepositComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  route = inject(ActivatedRoute)
  router = inject(Router)
  toast = inject(ToastService)
  reqConfirmation = inject(ConfirmationDialogService)
  window = window


  formHandler = inject(FormHandlerService);
  fb = inject(FormBuilder);
  paymentMethod:any
  minimum_deposit:any
  symbol:any
  localBank:any
  pendingDeposit:any
  isLocalDeposit:any
  cvtUSD:any
  walletAddress:any;
  method:any

  payWith:any
  defaultCurrency:any

  methodView: Record<PaymentMethodGrp, any> = {
    'Crypto':{
      'form':this.fb.group({
        payment_method: ['', [Validators.required]],
        amount: ['', [Validators.required, Validators.min]],
      })
    },
    'Local':{
      'form':this.fb.group({
        payment_method: ['', [Validators.required]],
        amount: ['', [Validators.required, Validators.min]],
      })

    },
  }

  setMetheod = this.methodView['Crypto']

  ngOnInit(): void {loadScript('assets/js/main.js');if (!this.storeData.get('deposit')){this.reqServerData.get("wallet?dir=start_deposit&showSpinner").subscribe({next: res =>this.showInvoice()})}else{this.showInvoice()}}

  onSubmit(processor:any,form:any): void {

    this.formHandler.submitForm(form, processor, 'wallet/?showSpinner',  (res) => {
      this.showInvoice()
    });
  }

  changePaymentMethod(event:any){

    const selectElement = event.target as HTMLSelectElement;

    const selectedId = selectElement.id;         // ← gets the `id` of the <select>
    const selectedValue = selectElement.value;   // ← gets the selected value

    // const selectedValue = (event.target as HTMLSelectElement).value;

    console.log({selectedValue}, this.storeData.get('init_currencies'));

    // this.method=this.storeData.get('init_currencies')[parseInt(selectedValue)]
    this.method = this.storeData.get('init_currencies').find((c:any) => c.code === selectedValue);

    this.paymentMethod = this.method
    this.methodView[selectedId as PaymentMethodGrp].paymentMethod=this.paymentMethod

    console.log({selectedId}, this.method);

    this.setPaymentMethod(selectedId)

  }

  defaultPaymentmethod() {
    this.method = this.storeData.get('wallet').init_currency;
    this.paymentMethod = this.method;

    this.methodView["Local"].paymentMethod = this.paymentMethod;

    // ✅ Set min deposit correctly
    let minimum_deposit = this.storeData.get('wallet').settings.minimum_deposit;
    this.methodView["Local"].paymentMethod["minimum_deposit"] =
      minimum_deposit * this.paymentMethod.rate;

    this.symbol = this.paymentMethod.symbol;

    this.setPaymentMethod("Local");
  }

  onPaymentSelect(event: Event): void {
    const target = event.target as HTMLElement;

    // Find the parent with id="Crypto"
    const parentWithId = target.closest('.payment-method-select');
    const parentId = parentWithId?.id || 'unknown';

    let inputElement: HTMLInputElement | null = null;

    // Case 1: Direct click on radio input
    if (target.tagName === 'INPUT') {
      inputElement = target as HTMLInputElement;
    }

    // Case 2: Clicked on label/image, find linked input via 'for' attribute
    if (!inputElement && target.closest('label')) {
      const forId = target.closest('label')?.getAttribute('for');
      inputElement = document.getElementById(forId!) as HTMLInputElement;
    }

    if (inputElement) {
      const selectedValue = inputElement.value;
      const selectedId = inputElement.id;
      const selectedMethod = 'Crypto'

      this.method=this.storeData.get('init_currencies')[parseInt(selectedValue)]
      this.methodView[parentId as PaymentMethodGrp].paymentMethod=this.method

      if (selectedId==='tron') {
        let minimum_deposit=this.storeData.get('wallet').settings.minimum_deposit
        this.methodView[selectedMethod as PaymentMethodGrp]['paymentMethod']['minimum_deposit'] = (minimum_deposit/this.methodView[selectedMethod as PaymentMethodGrp].paymentMethod.rate).toFixed(1)
        this.symbol = this.methodView[selectedMethod as PaymentMethodGrp].symbol
      }else{
        this.setPaymentMethod('Crypto')
      }

    }

  }

  setPaymentMethod(selectedMethod:any){

    let minimum_deposit=this.storeData.get('wallet').settings.minimum_deposit
    this.methodView[selectedMethod as PaymentMethodGrp]['paymentMethod']['minimum_deposit'] = minimum_deposit*this.methodView[selectedMethod as PaymentMethodGrp].paymentMethod.rate
    this.symbol = this.methodView[selectedMethod as PaymentMethodGrp].symbol

  }

  showInvoice(){

    const wallet= this.storeData.get("wallet")
    if (this.storeData.get('hasMethod')) {this.payWith=this.storeData.get('payWith')}

    this.pendingDeposit = this.storeData.get('deposit')[0]

    if (this.pendingDeposit) {
      this.isLocalDeposit=true;
      this.previewUrl=this.pendingDeposit.proof
      !["USD",'TRON'].includes(this.pendingDeposit.method)?this.localBank=this.storeData.get('local_banks').filter((bank:any)=>{
        return bank.currency===this.pendingDeposit.method
      }):[
        this.isLocalDeposit=false
      ]
    }

    loadScript('assets/js/main.js');

    if (wallet.init_currency.code === 'NGN') {
      console.log("SET DEFAULT NAIRA");
      this.defaultCurrency = "NGN";

      // ✅ Patch the Local form instead of this.form
      this.methodView["Local"].form.patchValue({
        payment_method: "NGN"
      });

      // ✅ Load NGN as default payment method
      this.defaultPaymentmethod();
    }



  }

  copyContent(text:any){
    copyContent(this.toast,text)
  }

  CancelPayment(type:any){

    this.reqConfirmation.confirmAction(()=>{
      this.reqServerData.get('wallet?dir=delete_deposit&showSpinner').subscribe()
    }, 'Delete', 'Continue to delete deposit ?' )


  }

  objKeys(obj:any,key:any){return Object.keys(obj).includes(key)}

  onAmountKeyup(event: KeyboardEvent,method:any): void {
    const input = (event.target as HTMLInputElement).value;
    // Optionally: parse & react
    const amount = parseFloat(input);
    if (!isNaN(amount)) {
      if (this.method.code==='TRON') {
        method.cvtUSD=amount*this.method.rate
      }else{
        method.cvtUSD=amount/this.method.rate
      }
    }
  }

  defaultImage = 'assets/upload.png'; // Put your placeholder image in assets
  previewUrl: string | null = null;
  selectedFile: File | null = null;


  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      // Optional: preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
      this.uploadImage()
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('image', this.selectedFile); // key must match Django's expected field name
    formData.append('origin', window.location.origin)
    this.reqServerData.post("upload/?processor=payment_receipt?showSpinner",formData).subscribe({next: res => this.showInvoice()})

  }

  currencyConverter(amount:any){
    const payment_method = this.storeData.get('wallet').init_currency
    return amount * payment_method.rate
  }

}
