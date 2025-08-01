import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { RequestDataService } from '../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../reuseables/http-loader/store-data.service';
import { SpinnerComponent } from '../reuseables/http-loader/spinner.component';

import { onScroll, padNum, loadScript } from '../reuseables/helper';

type MatchCategory = 'upcoming' | 'notStarted' | 'live' | 'finished' | 'secured';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, OnDestroy {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  router = inject(Router);

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

  ngOnInit(): void {
    // Run JS file
    loadScript('assets/js/main.js');

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
      } else {
        this.stopPolling();
      }
    });

    // Initial load if already on /main
    if (this.router.url === '/main') {
      this.startPolling();
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private startPolling(): void {
    if (this.isPolling) return; // avoid duplicate intervals
    this.isPolling = true;

    this.intervalId = setInterval(() => {
      this.loadFixtures();
    }, 70000);

    if (!this.storeData.get('soccer')) {
      this.loadFixtures("showSpinner");
    } else {
      this.categorizeMatches();
    }
  }

  private stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPolling = false;
  }

  loadFixtures(showSpinner = 'false') {
    this.reqServerData.get(`soccer/?${showSpinner}`).subscribe({
      next: res => {
        this.categorizeMatches();
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
    this.categorizedMatchesData[id as MatchCategory].display =
      this.loadData[id].displayedItems;
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
}
