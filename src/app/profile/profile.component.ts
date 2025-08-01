import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {  loadScript , copyContent, loadExternalScript} from '../reuseables/helper';

import { RequestDataService } from '../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../reuseables/http-loader/store-data.service';
import { SpinnerComponent } from '../reuseables/http-loader/spinner.component';
import { AuthService } from '../reuseables/auth/auth.service';

import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators , FormsModule} from '@angular/forms';
import { FormHandlerService } from '../reuseables/http-loader/form-handler.service';


declare var bootstrap: any;

@Component({
  selector: 'app-profile',
  imports: [CommonModule  ,RouterLink, SpinnerComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  authService = inject(AuthService);
  router = inject(Router);

  window=window
  current= 'profile'
  modal:any

  formHandler = inject(FormHandlerService);
  fb = inject(FormBuilder);

  form = this.fb.group({
    'old-password': ['', [Validators.required]],
      'new-password': ['', [Validators.required]],
  })

  ngOnInit(): void {
    // Run JS file
    loadScript('assets/js/main.js');
    if (!this.storeData.get('profile')) {
      this.reqServerData.get('profile').subscribe({
        next:res=>{
          console.log({res});

        }
      })
    }
  }

  ngAfterViewInit() {
    loadExternalScript()
  }

  openModal(modalID:any) {
    const modalElement = document.getElementById(modalID);
    this.modal = new bootstrap.Modal(modalElement!);
    this.modal.show();
  }

  onSubmit(){
    if (!this.form.valid)return;

      this.modal.hide()
     this.formHandler.submitForm(this.form,'changePassword', 'change-password/?showSpinner',  (res) => {
      if (res.status==='success') {this.authService.logout()}
    });
  }

  changeLanguage(){
    const languageSelector = document.querySelector('#google_translate_element img') as HTMLElement;

    if (languageSelector) {
      languageSelector.click();
    }
  }

}
