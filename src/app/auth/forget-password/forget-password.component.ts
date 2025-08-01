import { Component,inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {  loadScript , copyContent, loadExternalScript} from '../../reuseables/helper';
import { RouterLink, Router } from '@angular/router';
import { RequestDataService } from '../../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../../reuseables/http-loader/store-data.service';
import { ToastService } from '../../reuseables/toast/toast.service';
import { SpinnerComponent } from '../../reuseables/http-loader/spinner.component';

import { FormHandlerService } from '../../reuseables/http-loader/form-handler.service';
import { AuthService } from '../../reuseables/auth/auth.service';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forget-password',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink,SpinnerComponent],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.css'
})
export class ForgetPasswordComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  router = inject(Router)
  authService = inject(AuthService)
  RefCode:any
  window = window;
  formHandler = inject(FormHandlerService);
  fb = inject(FormBuilder);

  form = this.fb.group({
    email:['',[Validators.required, Validators.email]],
    // password:['',[Validators.required]]
  })


  ngOnInit(): void {
    // Run JS file
    loadScript('assets/js/main.js');
    loadExternalScript()
    if (this.authService.checkLogin()) {
      // const redirectUrl = localStorage['redirectUrl'] || '/main';
      this.router.navigate(['/main']); // or '/dashboard'
    }


  }

  onSubmit(){

    this.formHandler.submitForm(this.form,'forgot_password', 'forgot-password/?showSpinner',  (res) => {
      if (res.status==='success') {
        this.router.navigate(['/login']);
      }
    });

  }

}
