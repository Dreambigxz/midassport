import { Component, OnInit, OnDestroy, inject, ElementRef, AfterViewInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { RequestDataService } from '../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../reuseables/http-loader/store-data.service';
import { SpinnerComponent } from '../reuseables/http-loader/spinner.component';
import { TelegramBonusComponent } from '../telegram-bonus/telegram-bonus.component';

import { onScroll, padNum, loadScript } from '../reuseables/helper';
import { Modal } from 'bootstrap';
import { TelegramService } from '../reuseables/telegram-binder.service';

import { LoaderService } from '../reuseables/http-loader/loader.service';
import { AuthService } from '../reuseables/auth/auth.service';

type MatchCategory = 'upcoming' | 'notStarted' | 'live' | 'finished' | 'secured';
import { CountdownPipe } from '../reuseables/pipes/countdown.pipe';


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, TelegramBonusComponent, CountdownPipe],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css'] ,
  changeDetection: ChangeDetectionStrategy.OnPush

})

export class MainComponent implements OnInit, OnDestroy {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  router = inject(Router);
  // loaderService = inject(LoaderService)
  authService = inject(AuthService);

  parseInt = parseInt;

  fixtures: any;
  allMatches: any;
  upcoming: any;
  notStarted: any;
  live: any;
  finished: any;

  private intervalId: any;
  private isPolling = false;
  batchSize = 5;

  loadData: { [key: string]: any } = {};
  categorizedMatchesData: Record<MatchCategory, any> = {
    upcoming: { display: [], data: [] },
    notStarted: { display: [], data: [] },
    live: { display: [], data: [] },
    finished: { display: [], data: [] },
    secured: { display: [], data: [] }
  };
  current = 'main';
  telegramBonusModalActive = false
  installPromptEvent: any;

  bonusAmount: number = 3;

  activeTab= "notStarted"//'secured'; // default active tab

  installApp(device:any) {

    if (device==="IOS") {
      this.openModal("iosPwaModal")
    }else{
      this.installPromptEvent= this.storeData.get('installPromptEvent')
      if (this.installPromptEvent) {
        this.installPromptEvent.prompt();
        this.installPromptEvent.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            this.storeData.store['can_download_app']=false
          }
          this.installPromptEvent = null;
        });
      }
    }

  }

  ngOnInit(): void {

    // Watch for route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.urlAfterRedirects === '/main') {
        this.startPolling();
        // this.setTab(0)
        this.activeTab=this.activeTab
        const activeTab = document.querySelector('.sports-slider-item.'+this.activeTab) as HTMLElement;
        activeTab.click()

      } else {
        this.stopPolling();
      }
    });


    // Watch for tab visibility
    document.addEventListener('visibilitychange', () => {

      if (document.visibilityState === 'visible' && this.router.url === '/main') {
        this.startPolling();
        if (this.telegramBonusModalActive) {

          !this.storeData.store['joined']?this.reqServerData.get(`main/`).subscribe({
            next: res => {
              console.log({res});
              res.main.joined?this.closeModal('telegramBonusModal'):0;
              if (res.main.joined) {
                this.openModal('bonusModal')
              }

            }
          }):this.closeModal('telegramBonusModal')
        }

      } else {
        this.stopPolling();
      }
    });

    // Initial load if already on /main
    if (this.router.url === '/main') {
      this.startPolling();
    }

    loadScript('assets/js/main.js');

    console.log("HI");


  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private startPolling(): void {
    if (this.isPolling) return; // avoid duplicate intervals
    this.isPolling = true;

    // this.intervalId = setInterval(() => {
    //   this.loadFixtures("hideSpinner");
    // }, 60000);

    if (!this.storeData.get('soccer')) {
      this.loadFixtures();
    } else {
      !this.fixtures?this.categorizeMatches():0;
    }
  }

  private stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPolling = false;
  }

  loadFixtures(showSpinner="showSpinner") {
    this.reqServerData.get(`soccer/?${showSpinner}`).subscribe({
      next: res => {
        console.log({res});

        this.categorizeMatches();
        setTimeout(() => {
          !this.storeData.store['joined']?[this.openModal("telegramBonusModal"),this.telegramBonusModalActive=true]:0;
        }, 1000);


      }
    });
  }

  categorizeMatches() {

    const cpgs = this.storeData.get('company_games');
    let hasCpg = false
    this.fixtures = this.storeData.get('soccer');
    this.allMatches = this.fixtures//.fixtures.response;

    if (this.storeData.get('nextDayData')) {
      this.allMatches = [
        ...this.allMatches,
        ...this.storeData.store['nextDayData']//.fixtures.response
      ];
    }

    const now = new Date();
    const sortedData: { [key: string]: any } = {
      secured: [],
      notStarted: this.allMatches
      .filter((m: any) => new Date(m.fixture.fixture.timestamp * 1000) > now)
      .sort((a: any, b: any) => a.fixture.fixture.timestamp - b.fixture.fixture.timestamp),

      live: this.allMatches.filter((m: any) =>
        ['HT', '2H', '1H'].includes(m.fixture.fixture.status.short)
        // m.fixture.goals.home !==  null && m.fixture.fixture.status.short !== 'FT'
         // new Date(m.fixture.fixture.timestamp * 1000) < now && m.fixture.fixture.status.short !== 'FT'
      ),
      finished: this.allMatches.filter((m: any) =>
        m.fixture.fixture.status.short === 'FT'
      )
    };

    cpgs.forEach((element: any) => {
      const isSecured = sortedData['notStarted'].filter(
        (m: any) => m.fixture.fixture.id == element.fixtureID
      );
      if (isSecured.length) {
        isSecured[0]['secured'] = true;
        sortedData['secured'].push(isSecured[0]);
        hasCpg=true
      }
    });

    sortedData['upcoming'] = sortedData['notStarted'].slice(0, 10);

    Object.keys(this.categorizedMatchesData).forEach(k => {

      this.loadData[k] = {
        displayedItems: sortedData[k].slice(0, this.batchSize),
        batchSize: this.batchSize,
        currentIndex: this.batchSize,
        data: sortedData[k]
      };
      this.categorizedMatchesData[k as MatchCategory].data = sortedData[k];
        this.categorizedMatchesData[k as MatchCategory].display =
          this.loadData[k].displayedItems;
    });

    if (!this.categorizedMatchesData.notStarted.data.length) {
      this.nextDayData();
    }

      // 👇 ADD THIS: Switch to "Upcoming" if Secured is empty
      this.setTab();

  }

  setTab(timeout=1000){
    if (!this.categorizedMatchesData.secured.data.length) {

      setTimeout(() => {
        const notStarted = document.querySelector('.sports-slider-item.notStarted') as HTMLElement;
        if (notStarted) {
          this.activeTab='notStarted'
          console.log(this.activeTab);
          notStarted.click();
        }
      }, timeout); // wait a bit for DOM ready
    }else{
      this.activeTab='secured'
    }
  }

  onScroll(event: any, id: string) {
    onScroll(event, this.loadData[id]);
    this.categorizedMatchesData[id as MatchCategory].display =this.loadData[id].displayedItems;
  }

  setTime(timestamp: any) {
    timestamp = new Date(timestamp * 1000);
    const ampm = timestamp.getHours() >= 12 ? 'PM' : 'AM';
    return `${padNum(timestamp.getHours())}:${padNum(timestamp.getMinutes())} ${ampm}`;
  }

  setDate(timestamp: any) {
    return new Date(timestamp * 1000);
    // return start.getTime() - 24 * 60 * 60 * 1000
  }

  nextDayData(run_func = true) {
    this.reqServerData.get('soccer/?nextDayData=true').subscribe({
      next: nextDayData => {
        if (run_func) this.categorizeMatches();
      }
    });
  }

   // Programmatic open
   openModal(modalID:string|"telegramBonusModal") {
     const modalEl = document.getElementById(modalID);

     if (modalEl) {
       new Modal(modalEl).show();

       // if (modalID==="bonusModal") {
       //   addEventListener('shown.bs.modal', () => {
       //     this.startAmountAnimation();
       //   });
       //
       //   addEventListener('hidden.bs.modal', () => {
       //     cancelAnimationFrame(this.animationFrame);
       //     this.animatedAmount = 0; // reset
       //     this.canvasContainer.nativeElement.innerHTML = ''; // cleanup canvas
       //   })
       // }
     }


   }

   // Programmatic open
   closeModal(modalID:string|"telegramBonusModal") {
     const modalEl = document.getElementById(modalID);
     console.log({modalEl});
     this.telegramBonusModalActive=false
     if (modalEl) {
        const modal = Modal.getInstance(modalEl) || new Modal(modalEl);
        modal.hide();
    }


   }

   async requestNotificationPermission() {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert('✅ Notification permission granted');
    } else {
      alert('❌ Notification permission denied');
    }
}

  // handling Loadore Matches><
  loadMore(category: MatchCategory) {
    const state = this.loadData[category];
    const nextIndex = state.currentIndex + state.batchSize;

    // append next batch
    const moreItems = state.data.slice(state.currentIndex, nextIndex);
    state.displayedItems = [...state.displayedItems, ...moreItems];

    // update display + index
    this.categorizedMatchesData[category].display = state.displayedItems;
    state.currentIndex = nextIndex;
  }

  hasMore(category: MatchCategory) {

    const state = this.loadData[category];
    if (!state) return false;   // safeguard

    return state.currentIndex < state.data.length;
  }

  // currency convereter
  currencyConverter(amount:any){
    const payment_method = this.storeData.get('wallet').init_currency
    return amount * payment_method.rate
  }

  onCurrencyChange(event: Event) {
    const selectedCode = (event.target as HTMLSelectElement).value;
    if (!selectedCode) return
    console.log("Selected Currency Code:", selectedCode);

    this.reqServerData.post('main/',{processor:'change_currency',code:selectedCode}).subscribe(

    )
  }

}
