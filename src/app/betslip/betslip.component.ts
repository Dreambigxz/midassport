import { Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';


import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { RequestDataService } from '../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../reuseables/http-loader/store-data.service';

import { ToastService } from '../reuseables/toast/toast.service';
import { ButtonLoaderDirective } from '../reuseables/http-loader/button-loader.directive';
import { SpinnerComponent } from '../reuseables/http-loader/spinner.component';
import { ConfirmationDialogService } from '../reuseables/modals/confirmation-dialog/confirmation-dialog.service';
import {  loadScript , copyContent} from '../reuseables/helper';

import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';


import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';

import { padNum} from '../reuseables/helper';

type DivControlKey = 'showPredictionBoard';

@Component({
  selector: 'app-betslip',
  imports: [CommonModule,SpinnerComponent,FormsModule],
  templateUrl: './betslip.component.html',
  styleUrl: './betslip.component.css',
  animations: [
    trigger('fadeToggle', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition(':enter', [animate('300ms ease-in')]),
      transition(':leave', [animate('300ms ease-out')])
    ])
  ]
})

export class BetslipComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  route = inject(ActivatedRoute)
  toast = inject(ToastService)
  reqConfirmation = inject(ConfirmationDialogService)


  fixtures=this.storeData.store['soccer']
  fixture:any
  fixtureID:any;

  window=window
  divControlers ={'showPredictionBoard':true}
  startDate:any
  totalProfit:any = 0

  toggleDiv(name:DivControlKey) {
    this.divControlers[name] = !this.divControlers[name];
  }

  ngOnInit(): void {

    loadScript('assets/js/main.js');


    if (this.storeData.get('nextDayData')){
      this.fixtures = [...this.fixtures, ...this.storeData.store['nextDayData'] ]
      // this.fixtures.odds = {...this.fixtures.odds, ...this.storeData.store['nextDayData'].odds }
    }
    this.route.paramMap.subscribe(params => {
      if (!this.fixtures) {
        this.reqServerData.get('soccer/?showSpinner').subscribe({
          next:res=>{
            this.fixtures=this.storeData.store['soccer']
            this.setData(params.get('id'))
          }
        });
      }else{
        this.setData(params.get('id'))
      }
    });
  }

  setData(id:any){
    id=parseInt(id);this.fixtureID=id
    const [fixture]= this.fixtures.filter((m:any)=>m.fixture.fixture.id===id)
    this.predictionRows =fixture.odds//['odds'][id]
    this.fixture=fixture
    this.divControlers.showPredictionBoard=true
  }

  setTime(timestamp:any){
    this.startDate = new Date(timestamp*1000)
    const ampm = this.startDate.getHours() >= 12 ? 'PM' : 'AM';

    let result = `${padNum(this.startDate.getHours())}:${padNum(this.startDate.getMinutes())} ${ampm}`
    return result
  }

  predictionRows:any =[]
  selectedScore:any
  stakeAmount:any = 0


  onRowClick(row: any[],index:number) {}
  onCellClick(cell: { value: string; odds: string }) {
    this.selectedScore=cell
    this.toast.show({'message':'Selection added to slip', status:'success'})
    this.divControlers.showPredictionBoard=false
    this.scrollToId('betInfo')
  }

  setBetAmount(event: KeyboardEvent) {

    const inputValue = (event.target as HTMLInputElement).value;
    this.stakeAmount=inputValue
    this.setProfit()

  }

  setProfit(){
    const totalProfit = (this.stakeAmount * this.selectedScore.odds / 100 ).toFixed(2)

    this.totalProfit  = parseFloat(this.stakeAmount) + parseFloat(totalProfit)
    console.log({totalProfit:this.totalProfit});
  }

  slipHandler(processor:string){
    const slipData = {
      fixtureID:this.fixtureID,
      stakeAmount:this.stakeAmount,
      selectedScore:this.selectedScore,
      processor:'place_bet',
      startDate:this.startDate
    }

    this.reqConfirmation.confirmAction(()=>{
      this.reqServerData.post('bet/?showSpinner',{...slipData,processor}).subscribe({
        next:res=>{
          // save new bet to betsDB
          // if ('serviceWorker' in navigator && res.status === "success") {
          //   navigator.serviceWorker.ready.then(registration => {
          //     const bets = res.main.betDir.ticket.filter((bet: any) =>
          //       bet.status === 'open'
          //     )
          //
          //     // Send bets to the active SW
          //     if (registration.active) {
          //       registration.active.postMessage({ type: 'UPDATE_BETS', bets });
          //     }
          //   });
          // }
        }
      });
    },'Confirm', `Continue ${processor.split('_')[0].replace('e','')}ing bet with ${this.storeData.get('wallet')['base']['symbol']}${slipData.stakeAmount} ?`)

  }

  scrollToId(targetDiv:any) {
    const el = document.getElementById(targetDiv);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  stakeClickCount = 0;
  showEasterEgg = false;

  stakeAll() {
    // for example, set betAmount to wallet balance
    this.stakeAmount = (this.storeData.get('wallet')?.balance?.new)?.toFixed(3) || 0;
    this.setProfit()
  }

}
