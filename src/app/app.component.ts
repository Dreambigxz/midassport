import { Component,ViewChild,inject, ElementRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { RequestDataService } from './reuseables/http-loader/request-data.service';
import { StoreDataService } from './reuseables/http-loader/store-data.service';

import { loadScript } from './reuseables/helper';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'fbapp';

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);

  ngOnInit(): void {

  }

  ngAfterViewInit(){
    // if (!this.storeData.get('wallet')) {
    //   this.reqServerData.get('main/').subscribe({
    //     next: res => {
    //       console.log('GOT RES>><<', res);
    //       // console.log(this.storeData.store);
    //
    //     }
    //   });
    // }
  }


}
