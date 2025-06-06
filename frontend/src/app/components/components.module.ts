import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeComponent } from './home/home.component';
import { ComponentsRoutingModule } from './components-routing.module';

import { NgxDropzoneModule } from 'ngx-dropzone';


@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    ComponentsRoutingModule,
    NgxDropzoneModule
  ]
})
export class ComponentsModule { }
