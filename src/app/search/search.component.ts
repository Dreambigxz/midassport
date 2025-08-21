import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RequestDataService } from '../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../reuseables/http-loader/store-data.service';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

import { SpinnerComponent } from '../reuseables/http-loader/spinner.component';


import { padNum, loadScript } from '../reuseables/helper';

import { LoaderService } from '../reuseables/http-loader/loader.service';

@Component({
  selector: 'app-search',
  imports: [CommonModule, FormsModule, RouterLink, SpinnerComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  loaderService = inject(LoaderService);

  window=window

  fixtures:any;
  notStarted:any;
  searchText = '';

  filteredItems: any = [ ]

  ngOnInit(): void {

      if (!this.storeData.get('soccer')) {this.loadFixtures()}
      else{this.filterNotStarted()}
      loadScript('assets/js/main.js');

  }

  loadFixtures(){this.reqServerData.get('soccer/').subscribe({next: res => this.filterNotStarted()})}

  filterNotStarted(){

    this.fixtures=this.storeData.store['soccer']//.fixtures.response
    this.notStarted=this.fixtures.filter((m:any) => {
      return  new Date(m.fixture.fixture.timestamp*1000) > new Date();
    });

  }

  onSearch() {
    const term = this.searchText.toLowerCase();

    this.filteredItems = this.notStarted.filter((item:any) =>
      item.fixtures.teams.home.name.toLowerCase().includes(term)||
      item.fixtures.teams.away.name.toLowerCase().includes(term)||
      item.fixtures.league.name.toLowerCase().includes(term)
      // &&new Date(item.fixture.timestamp*1000) > new Date()
    );
    if (!term) this.filteredItems=[]

  }

  setTime(timestamp:any){
    timestamp = new Date(timestamp*1000)
    const ampm = timestamp.getHours() >= 12 ? 'PM' : 'AM';

    let result = `${padNum(timestamp.getHours())}:${padNum(timestamp.getMinutes())} ${ampm}`
    return result
  }


}
