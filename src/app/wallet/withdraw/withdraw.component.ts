import { Component,inject } from '@angular/core';
import { interval, Subscription } from 'rxjs';

import { CommonModule } from '@angular/common';

import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { RequestDataService } from '../../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../../reuseables/http-loader/store-data.service';
import { ToastService } from '../../reuseables/toast/toast.service';
import { SpinnerComponent } from '../../reuseables/http-loader/spinner.component';
import {  loadScript , copyContent} from '../../reuseables/helper';

import { FormHandlerService } from '../../reuseables/http-loader/form-handler.service';
import { TelegramService } from '../../reuseables/telegram-binder.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { ConfirmationDialogService } from '../../reuseables/modals/confirmation-dialog/confirmation-dialog.service';

type PaymentMethodGrp = 'Local'|'Crypto'
declare var bootstrap: any;

@Component({
  selector: 'app-withdraw',
  imports: [CommonModule,SpinnerComponent,ReactiveFormsModule],
  templateUrl: './withdraw.component.html',
  styleUrl: './withdraw.component.css'
})
export class WithdrawComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  route = inject(ActivatedRoute);router=inject(Router)
  toast = inject(ToastService)
  reqConfirmation = inject(ConfirmationDialogService)
  telegram = inject(TelegramService)
  window = window

  formHandler = inject(FormHandlerService);
  fb = inject(FormBuilder);

  paymentMethod:any
  minimum_withdraw:any
  symbol:any
  method:any
  payWith:any
  methodView: Record<PaymentMethodGrp, any> = {
    'Crypto':{
      'form':this.fb.group({
        payment_method: ['', [Validators.required]],
        amount: ['', [Validators.required, Validators.min]],
        account_number: ['', [Validators.required]],
        account_holder: [''],
        bank: [''],
        verification_code: ['', [Validators.required]],

      }),
      step:1
    },
    'Local':{
      'form':this.fb.group({
        payment_method: [''],
        amount: ['', [Validators.required, Validators.min]],
        account_number: ['', [Validators.required]],
        account_holder: ['', [Validators.required]],
        bank: ['', [Validators.required]],
        verification_code: ['', [Validators.required]],
      }),
      step:1

    },
  }

  hasMethod:any
  bindingTg=false
  pendingPayment:any

  ngOnInit(): void {

    // this.payWith = 'Local'
    loadScript('assets/js/main.js');
      if (!this.storeData.get('withdraw')) {this.reqServerData.get("wallet?dir=start_withdraw&showSpinner").subscribe({next: res => {this.initView()}})
      }else{this.initView()}

  }

  initView(){

    this.pendingPayment = this.storeData.get('withdraw')[0]
    if (this.storeData.get('hasMethod')) {
        this.payWith=this.storeData.get('payWith')
        this.setMethod(this.storeData.get('hasMethod'),this.payWith)
    }
    if (this.pendingPayment) {
      this.activateTimer(new Date(this.pendingPayment.timestamp))
    }

    this.defaultPaymentmethod()

  }

  defaultPaymentmethod() {

    const wallet  = this.storeData.get('wallet')

    if (wallet.init_currency.code === 'NGN') {
      console.log("SET DEFAULT NAIRA");
      this.defaultCurrency = "NGN";

      // ✅ Patch the Local form instead of this.form
      this.methodView["Local"].form.patchValue({
        payment_method: "NGN"
      });

      // ✅ Load NGN as default payment method
      // this.defaultPaymentmethod();
    }


    this.method = this.storeData.get('wallet').init_currency;
    this.paymentMethod = this.method;

    this.methodView["Local"].paymentMethod = this.paymentMethod;

    // ✅ Set min deposit correctly
    let minimum_withdraw = this.storeData.get('wallet').settings.minimum_withdraw;
    this.methodView["Local"].paymentMethod["minimum_withdraw"] =
      minimum_withdraw * this.paymentMethod.rate;

    this.symbol = this.paymentMethod.symbol;

    this.setMethod(this.method,"Local");
  }

  setMethod(method:any,payWith:any){

    if (!method)return;

    this.method=method//this.storeData.get('hasMethod')
    this.paymentMethod = this.method
    this.methodView[payWith as PaymentMethodGrp].paymentMethod=this.paymentMethod

    let minimum_withdraw=this.storeData.get('wallet').settings.minimum_withdraw
    if (this.method.code==='TRON') {
      this.methodView[payWith as PaymentMethodGrp]['paymentMethod']['minimum_withdraw'] = (minimum_withdraw/this.methodView[payWith as PaymentMethodGrp].paymentMethod.rate).toFixed(1)
    }else{
      this.methodView[payWith as PaymentMethodGrp]['paymentMethod']['minimum_withdraw'] = minimum_withdraw*this.methodView[payWith as PaymentMethodGrp].paymentMethod.rate
    }




  }

  changePaymentMethod(event:any){

    const selectElement = event.target as HTMLSelectElement;

    const selectedId = selectElement.id;         // ← gets the `id` of the <select>
    const selectedValue = selectElement.value;   // ← gets the selected value

    this.setMethod(this.storeData.get('init_currencies')[parseInt(selectedValue)],selectedId)
    // this.method=this.storeData.get('init_currencies')[parseInt(selectedValue)]
    // this.paymentMethod = this.method
    // this.methodView[selectedId as PaymentMethodGrp].paymentMethod=this.paymentMethod

    // this.setPaymentMethod(selectedId)


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
      this.setMethod(this.method,'Crypto')
    }

  }

  onSubmit(processor:any,form:any): void {this.formHandler.submitForm(form, processor, 'wallet/?showSpinner',  (res) => this.initView())}

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

  step = 1

  nextStep(data:any,step=2) {
    data.step = step;

  }

  prevStep(data:any,step=1) {
    data.step = step;
  }

  codeInput: string = '';
  timer: number = 0;
  countdownInterval: any;

  openModal() {
    const modalElement = document.getElementById('methodModal');
    const modal = new bootstrap.Modal(modalElement!);
    modal.show();
  }

  sendCode(method: 'email' | 'telegram') {

    let Continue = ()=>{
      if (method==='telegram'&&!this.storeData.get('bindedTg')) {
          this.bindingTg=true
          this.telegram.connect()
          return
      }
      this.reqServerData.post("wallet/?showSpinner",{processor:'verification_code',method}).subscribe({next: res => {
        this.startCountdown(60); // 60 seconds timer
      }})
    }

    if (this.bindingTg) {
      this.bindingTg=false
      this.reqServerData.get("main").subscribe({next: res => Continue()})
    }else{Continue()}

  }

  startCountdown(seconds: number) {
    this.timer = seconds;
    clearInterval(this.countdownInterval);

    this.countdownInterval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  CancelPayment(type:any){this.reqConfirmation.confirmAction(()=>{this.reqServerData.get(`wallet?dir=delete_${type}&showSpinner`).subscribe()}, 'Delete', `Continue to delete ${type} ?` )}

  startDate!:Date //= new Date('2025-07-28T12:00:00'); // example
  endDate!: Date;

  days = 0;
  hours = 0;
  minutes = 0;
  seconds = 0;

  defaultCurrency : any

  private timerSub!: Subscription;

  activateTimer(startDate:Date): void {

    this.startDate = startDate

    this.endDate = new Date(this.startDate.getTime() + this.storeData.get('wallet').settings.max_await_time.withdraw * 60 * 60 * 1000);

    this.updateCountdown();
    this.timerSub = interval(1000).subscribe(() => this.updateCountdown());
  }

  updateCountdown(): void {
    const now = new Date();
    const diff = this.endDate.getTime() - now.getTime();

    if (diff > 0) {
      const totalSeconds = Math.floor(diff / 1000);
      this.days = Math.floor(totalSeconds / (3600 * 24));
      this.hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      this.minutes = Math.floor((totalSeconds % 3600) / 60);
      this.seconds = totalSeconds % 60;
    } else {
      // Countdown finished
      this.days = this.hours = this.minutes = this.seconds = 0;
      if (this.timerSub) this.timerSub.unsubscribe();
    }
  }

  ngOnDestroy(): void {if (this.timerSub) this.timerSub.unsubscribe();}

  currencyConverter(amount:any){
    const payment_method = this.storeData.get('wallet').init_currency
    return amount * payment_method.rate
  }

}
