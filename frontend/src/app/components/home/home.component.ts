import { Component } from '@angular/core';
import { FileuploadService } from 'src/app/services/fileupload.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  isFirstOpen = true;
  uploadedFiles: any[] = [];

  constructor(private fileuploadService: FileuploadService) {}

  ngOnInit(): void {
    this.fileuploadService.getAllFiles().subscribe({
      next: (data) => {
        this.uploadedFiles = data;
        console.log('Fetched files:', this.uploadedFiles);
      },
      error: (err) => {
        console.error('Error fetching files:', err);
      },
    });
  }
}
