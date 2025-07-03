import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InventoryRoutingModule } from './inventory-routing-module';
import { ResourcesComponent } from './resources/resources';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ResourceTypesComponent } from './resource-types/resource-types';
import { SharedModule } from '../../shared/shared-module';



@NgModule({
  declarations: [
    //ResourcesComponent
    //ResourceTypesComponent
  ],
  imports: [
    CommonModule,
    InventoryRoutingModule,
    RouterModule,
    ReactiveFormsModule,
    HttpClientModule,
    FontAwesomeModule,
    SharedModule
  ],
    exports: [
      //ResourcesComponent
    ]
})
export class InventoryModule { }
