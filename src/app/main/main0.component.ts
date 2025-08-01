import { Component, OnInit, inject} from '@angular/core';
import { CommonModule } from '@angular/common';


import { RequestDataService } from '../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../reuseables/http-loader/store-data.service';
import { SpinnerComponent } from '../reuseables/http-loader/spinner.component';
import { RouterLink, Router } from '@angular/router';

import { ButtonLoaderDirective } from '../reuseables/http-loader/button-loader.directive';

// import { FormHandlerService } from '../reuseables/http-loader/form-handler.service';

// import { ConfirmationDialogService } from '../reuseables/modals/confirmation-dialog/confirmation-dialog.service';

import { onScroll, loadMore, padNum, loadScript } from '../reuseables/helper';

type MatchCategory = 'upcoming' | 'notStarted' | 'live' | 'finished' | "secured";

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule,RouterLink,SpinnerComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})

export class MainComponent implements OnInit {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  router = inject(Router)

  parseInt = parseInt

  fixtures:any;
  allMatches:any
  upcoming :any
  notStarted:any
  live:any
  finished:any

  private intervalId: any;
  batchSize = 5

  loadData:{ [key: string]: any } = {}
  categorizedMatchesData: Record<MatchCategory, any> = {
    upcoming :{display:[],data:[]},
    notStarted:{display:[],data:[]},
    live:{display:[],data:[]},
    finished:{display:[],data:[]},
    secured:{display:[],data:[]}
  }
  current = 'main'
  ngOnInit(): void {

    this.intervalId = setInterval(() => {
      this.loadFixtures();
    }, 70000); // every 70s

    if (!this.storeData.get('soccer')) {this.loadFixtures("showSpinner")}
    else{this.categorizeMatches()}

    loadScript('assets/js/main.js');

  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  loadFixtures(showSpinner='false'){this.reqServerData.get(`soccer/?${showSpinner}`).subscribe({next: res => {this.categorizeMatches();}});}

  categorizeMatches() {

    const cpgs =  this.storeData.get('company_games')

    this.fixtures=this.storeData.get('soccer')

    this.allMatches=this.fixtures.fixtures.response

    if (this.storeData.get('nextDayData')){
      console.log('NEXT DAY DATA EXIST');
      this.allMatches = [...this.allMatches, ...this.storeData.store['nextDayData'].fixtures.response ]
    }

    const now = new Date();
    const sortedData: { [key: string]: any } = {}

    sortedData['secured'] = []

    sortedData['notStarted']=this.allMatches.filter((m:any) => {
      return  new Date(m.fixture.timestamp*1000) > now;
    });

    cpgs.forEach((element:any) => {
      const isSecured = sortedData['notStarted'].filter((m:any) => m.fixture.id==element.fixtureID)
      console.log({isSecured});
      isSecured.length?[
        isSecured[0]['secured']=true,
        sortedData['secured'].push(isSecured[0]),

      ]:0;

    });

    sortedData['live'] = this.allMatches.filter((m:any) => ['HT','2H','1H'].includes(m.fixture.status.short));
    sortedData['finished'] = this.allMatches.filter((m:any) => m.fixture.status.short === 'FT');

    // sort notStarted by time
    // sortedData['notStarted'] = [...sortedData['notStarted']].sort((a, b) =>
    //   new Date(a.fixture.timestamp*1000).getTime() - new Date(b.fixture.timestamp*1000).getTime()
    // );

    sortedData['upcoming']=sortedData['notStarted'].slice(0, 10);


    Object.keys(this.categorizedMatchesData).forEach(k => {
      // if (!Object.keys(this.loadData).includes(k)) {
      if (true) {
        this.loadData[k]={
          displayedItems:[],
          batchSize: 6,
          currentIndex : 0,
          data:sortedData[k]
        }
      }
      this.categorizedMatchesData[k as MatchCategory].data = sortedData[k]
      this.categorizedMatchesData[k as MatchCategory].display = sortedData[k].slice(0, this.batchSize);

    });
    console.log('DONE SETTING', this.categorizedMatchesData, new Date());
    if(!this.categorizedMatchesData.notStarted.data.length){this.nextDayData()}

  }

  onScroll(event: any,id:string) {

    onScroll(event,this.loadData[id])
    this.categorizedMatchesData[id as MatchCategory].display= this.loadData[id].displayedItems

  }

  setTime(timestamp:any){
    timestamp = new Date(timestamp*1000)
    const ampm = timestamp.getHours() >= 12 ? 'PM' : 'AM';

    let result = `${padNum(timestamp.getHours())}:${padNum(timestamp.getMinutes())} ${ampm}`
    return result
  }

  nextDayData(run_func=true){
    this.reqServerData.get('soccer/?nextDayData=true').subscribe({next: nextDayData => {
      run_func?this.categorizeMatches():0;
    }});

  }


}
