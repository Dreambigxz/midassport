import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';


@Component({
  selector: 'app-status-dialog',
  imports:[CommonModule,
    MatIconModule,MatButtonModule,MatDialogModule,
  ],
  templateUrl: './status-dialog.component.html',
  styleUrls: ['./status-dialog.component.css']
})
export class StatusDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    title: string;
    message: string;
    status: 'success' | 'error';
  }) {}

}
