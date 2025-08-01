import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  imports: [
    CommonModule,
    MatIconModule

  ],
})
export class ToastComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: { message: any, status: any }) {}
}
