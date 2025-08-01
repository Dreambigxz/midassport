import { Injectable, inject } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmationDialogService{

  dialog=inject(MatDialog)

  confirmAction(callback:any,title:any|null,message:any|null):void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: title,
        message: message
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        callback?callback():0;
      }
    });
  }

}
