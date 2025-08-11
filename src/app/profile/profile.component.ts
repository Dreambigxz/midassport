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
import { PushNotificationService } from '../reuseables/push-notification.service';


declare var bootstrap: any;

@Component({
  selector: 'app-profile',
  imports: [CommonModule  ,RouterLink, SpinnerComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})

export class ProfileComponent {

  subscribed = false;

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  authService = inject(AuthService);
  pushService= inject(PushNotificationService)
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

  async ngOnInit(): Promise<void> {
  // Run JS file
    loadScript('assets/js/main.js');

    // Wait for subscription check
    this.subscribed = await this.pushService.isSubscribed();

    console.log("subscribed>>",this.subscribed);


    if (!this.storeData.get('profile')) {
      this.reqServerData.get('profile').subscribe({
        next: res => {
          console.log({ res });
        }
      });
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

  async toggleSubscription(event:any) {

    const enable = (event.target as HTMLInputElement).checked;
    console.log({enable});

    if (enable) {
      await this.pushService.subscribeUser();
    } else {
      await this.pushService.unsubscribeUser();
    }
    console.log({enable});

    this.subscribed = await this.pushService.isSubscribed();
  }

}
