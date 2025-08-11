import { Component, OnInit, OnDestroy, inject, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
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


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, TelegramBonusComponent],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
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
  installApp() {
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

  ngOnInit(): void {


    // Run JS file

    // Watch for route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.urlAfterRedirects === '/main') {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    });

    // Watch for tab visibility
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.router.url === '/main') {

        this.startPolling();
        console.log('PAGE NOW visible');

        if (this.telegramBonusModalActive) {
          console.log('Checking bindedTg');

          !this.storeData.store['joined']?this.reqServerData.get(`main`).subscribe({
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

  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private startPolling(): void {
    if (this.isPolling) return; // avoid duplicate intervals
    this.isPolling = true;

    this.intervalId = setInterval(() => {
      this.loadFixtures("hideSpinner");
    }, 70000);

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
        this.categorizeMatches();
        setTimeout(() => {
          !this.storeData.store['joined']?[this.openModal("telegramBonusModal"),this.telegramBonusModalActive=true]:0;
        }, 1000);

        if (showSpinner==="showSpinner"&&'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            const bets = res.main.betDir.ticket.filter((bet: any) =>
              bet.status === 'open'
            )

            // Send bets to the active SW
            if (registration.active) {
              registration.active.postMessage({ type: 'UPDATE_BETS', bets });
              console.log('Sent bets to service worker');
            }
          });
        }
      }
    });
  }

  categorizeMatches() {
    const cpgs = this.storeData.get('company_games');
    this.fixtures = this.storeData.get('soccer');
    this.allMatches = this.fixtures.fixtures.response;

    if (this.storeData.get('nextDayData')) {
      this.allMatches = [
        ...this.allMatches,
        ...this.storeData.store['nextDayData'].fixtures.response
      ];
    }

    const now = new Date();
    const sortedData: { [key: string]: any } = {
      secured: [],
      notStarted: this.allMatches.filter((m: any) =>
        new Date(m.fixture.timestamp * 1000) > now
      ),
      live: this.allMatches.filter((m: any) =>
        ['HT', '2H', '1H'].includes(m.fixture.status.short)
      ),
      finished: this.allMatches.filter((m: any) =>
        m.fixture.status.short === 'FT'
      )
    };

    cpgs.forEach((element: any) => {
      const isSecured = sortedData['notStarted'].filter(
        (m: any) => m.fixture.id == element.fixtureID
      );
      if (isSecured.length) {
        isSecured[0]['secured'] = true;
        sortedData['secured'].push(isSecured[0]);
      }
    });

    sortedData['upcoming'] = sortedData['notStarted'].slice(0, 10);

    Object.keys(this.categorizedMatchesData).forEach(k => {
      this.loadData[k] = {
        displayedItems: [],
        batchSize: 6,
        currentIndex: 0,
        data: sortedData[k]
      };
      this.categorizedMatchesData[k as MatchCategory].data = sortedData[k];
      this.categorizedMatchesData[k as MatchCategory].display =
        sortedData[k].slice(0, this.batchSize);
    });

    console.log('DONE SETTING', this.categorizedMatchesData, new Date());

    if (!this.categorizedMatchesData.notStarted.data.length) {
      this.nextDayData();
    }

      // 👇 ADD THIS: Switch to "Upcoming" if Secured is empty
    if (!this.categorizedMatchesData.secured.data.length) {
      setTimeout(() => {
        const upcomingTab = document.querySelector('.sports-slider-item.upcomingTab') as HTMLElement;

        if (upcomingTab) {
          upcomingTab.click();
        }
      }, 1000); // wait a bit for DOM ready
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

  nextDayData(run_func = true) {
    this.reqServerData.get('soccer/?nextDayData=true').subscribe({
      next: nextDayData => {
        if (run_func) this.categorizeMatches();
      }
    });
  }

  // displat BONUS OFFER
  // @ViewChild('canvasContainer', { static: false }) canvasContainer!: ElementRef;
  //  animatedAmount: number = 0;
   bonusAmount: number = 3;
   // private animationFrame: any;
   // private modalInstance: any;

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

   // Animate the amount counting up
  //  startAmountAnimation() {
  //
  //
  //    let start = 0;
  //    const end = this.bonusAmount;
  //    const duration = 1200;
  //    const startTime = performance.now();
  //
  //    const animate = (time: number) => {
  //      const progress = Math.min((time - startTime) / duration, 1);
  //      this.animatedAmount = parseFloat((start + progress * (end - start)).toFixed(2));
  //      if (progress < 1) {
  //        requestAnimationFrame(animate);
  //      }
  //    };
  //    requestAnimationFrame(animate);
  // }

  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
    } else {
      console.warn('❌ Notification permission denied');
    }
}

}
