import { Component,inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {  loadScript , loadExternalScript} from '../../reuseables/helper';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { RequestDataService } from '../../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../../reuseables/http-loader/store-data.service';
import { ToastService } from '../../reuseables/toast/toast.service';
import { SpinnerComponent } from '../../reuseables/http-loader/spinner.component';

import { FormHandlerService } from '../../reuseables/http-loader/form-handler.service';
import { AuthService } from '../../reuseables/auth/auth.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { UserLocationService } from '../../reuseables/user-location.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink,SpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'

})

export class LoginComponent  {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  route = inject(ActivatedRoute)
  router = inject(Router)
  authService = inject(AuthService)

  window = window;

  formHandler = inject(FormHandlerService);
  fb = inject(FormBuilder);

  form = this.fb.group({
    identifier:['',[Validators.required]],
    password:['',[Validators.required]]
  })

  geolocation:any
  private geo = inject(UserLocationService)




  async ngOnInit()   {
    // Run JS file
    loadScript('assets/js/main.js');
    loadExternalScript()
    if (this.authService.checkLogin()) {
      this.router.navigate(['/main']); // or '/dashboard'
    }

    let geolocation = localStorage["geo"]
    if (!geolocation) {
       const { country, code, flag } = await this.geo.getLocation();
       localStorage["geo"]=JSON.stringify({country,code,flag})
       this.geolocation ={country,code,flag}
    }
    else{this.geolocation = JSON.parse(geolocation)}


  }

  onSubmit(){

    this.formHandler.submitForm(this.form,'login', 'login/?showSpinner',  (res) => {
      if (res.status==='success') {
        // login user
        this.authService.login(res.main.token,'login').subscribe(() => {
          // ✅ redirect to the page user wanted before login
         const redirectUrl = localStorage['redirectUrl'] || '/main';
         // redirectUrl==="/main"
         this.router.navigate([redirectUrl]);
         this.authService.loaderService.show()
         // window.location.href=redirectUrl
         // clear redirectUrl so it doesn’t persist
         delete localStorage['redirectUrl'];
        });
      }
      // this.showInvoice()
    });

  }

  showPassword: boolean = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }


}
