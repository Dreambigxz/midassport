import { Component,inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {  loadScript , copyContent, loadExternalScript} from '../../reuseables/helper';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { RequestDataService } from '../../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../../reuseables/http-loader/store-data.service';
import { ToastService } from '../../reuseables/toast/toast.service';
import { SpinnerComponent } from '../../reuseables/http-loader/spinner.component';

import { FormHandlerService } from '../../reuseables/http-loader/form-handler.service';
import { AuthService } from '../../reuseables/auth/auth.service';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';


@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink,SpinnerComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  reqServerData = inject(RequestDataService);
  storeData = inject(StoreDataService);
  route = inject(ActivatedRoute)
  router = inject(Router)
  authService = inject(AuthService)
  RefCode:any
  window = window;
  formHandler = inject(FormHandlerService);
  fb = inject(FormBuilder);

  invitedBy=this.storeData.get('invitedBy')

  form = this.fb.group({
    username:['',[Validators.required]],
    email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      RefCode:[""]
      // referrer: ['']  // 👈 added here

  })


  ngOnInit(): void {
    // Run JS file
    loadScript('assets/js/main.js');
    loadExternalScript()

    if (this.authService.checkLogin()) {
      this.router.navigate(['/main']); // or '/dashboard'
    }

    let checkUrl = window.location.href.split('RefCode')

    if (checkUrl[1]) {
      this.RefCode=checkUrl[1].replaceAll('=','')
      localStorage['invitedBy']=this.RefCode
    }else{
      if (localStorage['invitedBy']) {
        this.RefCode=localStorage['invitedBy']
      }
    }

    if (this.RefCode&&!this.invitedBy) {
      this.reqServerData.get('register?RefCode='+this.RefCode).subscribe({
        next:res =>{
          this.invitedBy=res.main.invitedBy
        }
      })
    }


  }

  onSubmit(){


    console.log(this.RefCode);

    if (this.RefCode) {
      console.log("Adding RefCode");
      this.form.patchValue({ RefCode: this.RefCode });
     }
    this.formHandler.submitForm(this.form,'AUTHENTICATIONS', 'register/?showSpinner',  (res) => {
      console.log({res});

      if (res.status==='success') {
        // login user
        this.authService.login(res.main.token).subscribe(() => {
          // ✅ redirect to the page user wanted before login
         const redirectUrl = '/main';
         delete(localStorage["invitedBy"])
         this.router.navigate([redirectUrl]);
        });
      }
      // this.showInvoice()
    });



  }

  showPassword: boolean = true;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }


}
