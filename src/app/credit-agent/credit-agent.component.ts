import { Component,inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RequestDataService } from '../reuseables/http-loader/request-data.service';
import { StoreDataService } from '../reuseables/http-loader/store-data.service';
import { ConfirmationDialogService } from '../reuseables/modals/confirmation-dialog/confirmation-dialog.service';
import { SpinnerComponent } from '../reuseables/http-loader/spinner.component';

import { Router, ActivatedRoute } from '@angular/router';
import { timeSince, copyContent, loadScript } from '../reuseables/helper';

import { FormHandlerService } from '../reuseables/http-loader/form-handler.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';


@Component({
  selector: 'app-credit-agent',
  imports: [CommonModule,SpinnerComponent,ReactiveFormsModule],
  templateUrl: './credit-agent.component.html',
  styleUrl: './credit-agent.component.css'
})
export class CreditAgentComponent {

  window = window
  isLoadingContent=false

  public router = inject(Router)


  storeData = inject(StoreDataService)
  reqServerData = inject(RequestDataService)
  reqConfirmation = inject(ConfirmationDialogService)

  formHandler = inject(FormHandlerService);
  fb = inject(FormBuilder);

  form = this.fb.group({
    identifier:['',[Validators.required]],
    amount:['',[Validators.required]]
  })



  ngOnInit():void{

    loadScript('assets/js/main.js');

  }

  onSubmit(){
    this.formHandler.submitForm(this.form,'', 'credit-agent/?showSpinner',  (res) => {

      if (res.status==='success') {

      }

    })
  }




}
