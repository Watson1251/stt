import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeComponent } from './home/home.component';
import { ComponentsRoutingModule } from './components-routing.module';

import { NgxDropzoneModule } from 'ngx-dropzone';
import { UiModule } from '../pages/ui/ui.module';
import { TranscriptionComponent } from './transcription/transcription.component';
import { PaginatorComponent } from './paginator/paginator.component';
import { AngularMaterialModule } from '../angular-material.module';
import { DropfileComponent } from './dropfile/dropfile.component';
import { WavesurferComponent } from './wavesurfer/wavesurfer.component';

@NgModule({
  declarations: [
    HomeComponent,
    DropfileComponent,
    TranscriptionComponent,
    PaginatorComponent,
    WavesurferComponent,
  ],
  imports: [
    CommonModule,
    ComponentsRoutingModule,
    NgxDropzoneModule,
    UiModule,
    AngularMaterialModule,
  ],
})
export class ComponentsModule { }
