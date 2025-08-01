import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { SpinnerComponent } from './spinner.component';
import { ButtonLoaderDirective } from './button-loader.directive';

@NgModule({
  imports: [CommonModule, HttpClientModule],
  declarations: [SpinnerComponent, ButtonLoaderDirective],
  exports: [SpinnerComponent, ButtonLoaderDirective]
})
export class HttpLoaderModule {}
