import { Component, Input } from '@angular/core';
import { UploadFileModel } from 'src/app/models/upload-file.model';
import { FileuploadService } from 'src/app/services/fileupload.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { TranscriptionsService } from 'src/app/services/transcription.service';

@Component({
  selector: 'app-dropfile',
  templateUrl: './dropfile.component.html',
  styleUrls: ['./dropfile.component.scss'],
})
export class DropfileComponent {
  @Input() acceptedTypes: string = '';
  uploadQueue: UploadFileModel[] = [];
  isUploading = false;

  constructor(
    private snackbarService: SnackbarService,
    private fileuploadService: FileuploadService,
    private transcriptionsService: TranscriptionsService
  ) { }

  onSelect(event: any) {
    const newFiles: File[] = event.addedFiles;
    const { uniqueFiles, duplicateNames } = this.filterDuplicates(newFiles);

    const models: UploadFileModel[] = uniqueFiles.map((file) => ({
      file,
      status: 'pending',
      progress: 0,
      objectUrl: this.isAudioType(file) ? URL.createObjectURL(file) : undefined,
    }));

    this.uploadQueue.push(...models);

    if (duplicateNames.length > 0) {
      this.snackbarService.openSnackBar(
        `تم تجاهل الملفات المكررة:\n${duplicateNames.join('\n')}`,
        'failure'
      );
    }

    this.startNextUpload();
  }

  private startNextUpload() {
    if (this.isUploading) return;

    const next = this.uploadQueue.find((f) => f.status === 'pending');
    if (!next) {
      // ✅ All files uploaded
      const allDone = this.uploadQueue.every(
        (f) => f.status === 'done' || f.status === 'error'
      );
      if (allDone) {
        // Clear dropzone
        this.uploadQueue = [];
        // Notify parent
        this.fileuploadService.getFiles();
      }
      return;
    }

    this.isUploading = true;
    next.status = 'uploading';

    this.fileuploadService.upload(next.file).subscribe({
      next: (event) => {
        next.progress = event.progress;
        if (event.progress === 100) {
          next.status = 'done';
          next.responseData = event.result;

          // 👇 Create a transcription with returned fileId
          const fileId = event.result?.fileId || event.result?._id || '';
          if (fileId) {
            this.transcriptionsService.createTranscription({ fileId, status: 'pending' }).subscribe({
              next: () => {
                this.snackbarService.openSnackBar(
                  `تم رفع ${next.file.name} وإنشاء التفريغ بنجاح`,
                  'success'
                );
              },
              error: () => {
                this.snackbarService.openSnackBar(
                  `تم رفع ${next.file.name} ولكن فشل إنشاء التفريغ`,
                  'failure'
                );
              }
            });
          }

          this.isUploading = false;
          this.startNextUpload();
        }
      },
      error: () => {
        next.status = 'error';
        this.snackbarService.openSnackBar(
          `فشل رفع الملف ${next.file.name}`,
          'failure'
        );
        this.isUploading = false;
        this.startNextUpload();
      }
    });

  }

  onRemove(fileModel: UploadFileModel) {
    if (fileModel.objectUrl) {
      URL.revokeObjectURL(fileModel.objectUrl);
    }
    this.uploadQueue = this.uploadQueue.filter((f) => f !== fileModel);
  }

  private filterDuplicates(filesToAdd: File[]): {
    uniqueFiles: File[];
    duplicateNames: string[];
  } {
    const uniqueFiles: File[] = [];
    const duplicateNames: string[] = [];

    for (const file of filesToAdd) {
      const isDuplicate = this.uploadQueue.some(
        (f) => f.file.name === file.name && f.file.type === file.type
      );

      if (!isDuplicate) {
        uniqueFiles.push(file);
      } else {
        duplicateNames.push(file.name);
      }
    }

    return { uniqueFiles, duplicateNames };
  }

  isImage(f: UploadFileModel): boolean {
    return f.file.type.startsWith('image/');
  }

  isVideo(f: UploadFileModel): boolean {
    return f.file.type.startsWith('video/');
  }

  isAudio(f: UploadFileModel): boolean {
    return f.file.type.startsWith('audio/');
  }

  private isAudioType(file: File): boolean {
    return file.type.startsWith('audio/');
  }
}
