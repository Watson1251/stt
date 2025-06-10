import { Component } from '@angular/core';
import { FileuploadService } from 'src/app/services/fileupload.service';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { Subscription } from 'rxjs';
import { FileModel } from 'src/app/models/upload-file.model';
import { TranscriptionModel } from 'src/app/models/transcription.model';
import { SnackbarService } from 'src/app/services/snackbar.service';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MAT_MOMENT_DATE_FORMATS,
  MomentDateAdapter,
} from '@angular/material-moment-adapter';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'ar' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
  ],
})
export class HomeComponent {
  files: FileModel[] = [];
  transcriptions: TranscriptionModel[] = [];
  private filesSub?: Subscription;

  dataSource: MatTableDataSource<TranscriptionModel> | undefined;

  constructor(
    private fileuploadService: FileuploadService,
    private snackbarService: SnackbarService
  ) {
    this.dataSource = new MatTableDataSource(this.transcriptions);
  }

  paginatedTranscriptions: TranscriptionModel[] = [];

  updatePaginatedTranscriptions(pageIndex: number, pageSize: number) {
    if (!this.transcriptions) return;
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    this.paginatedTranscriptions = this.transcriptions.slice(
      startIndex,
      endIndex
    );
  }

  onDeleteFile(fileId: string, event: Event) {
    event.stopPropagation(); // Prevent accordion from toggling

    const file = this.files.find((f) => f.id === fileId);
    if (!file) {
      console.error('File not found for deletion:', fileId);
      return;
    }

    if (confirm(`هل أنت متأكد من حذف الملف: ${file.filename}؟`)) {
      this.fileuploadService.deleteFile(fileId).subscribe({
        next: (res) => {
          // Remove file from UI after successful delete
          this.files = this.files.filter((f) => f.id !== fileId);
          this.snackbarService.openSnackBar('تم حذف الملف بنجاح', 'success');
          this.fileuploadService.getFiles(); // Refresh file list
        },
        error: (err) => {
          console.error('خطأ أثناء حذف الملف:', err);
          this.snackbarService.openSnackBar(
            'حدث خطأ أثناء حذف الملف',
            'failure'
          );
        },
      });
    }
  }

  getAccordionStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'accordion-danger';
      case 'segmented':
        return 'accordion-info';
      case 'processed':
        return 'accordion-success';
      default:
        return 'accordion-secondary';
    }
  }

  getStatus(status: string): string {
    if (status === 'pending') return 'قيد المعالجة';
    if (status === 'segmented') return 'تم تقسيم الملف';
    if (status === 'processed') return 'تم معالجة الملف';
    return 'غير معروف';
  }

  getFileUploadTime(fileId: string): number {
    const file = this.files.find((f) => f.id === fileId);
    return file?.uploadTime ? Number(file.uploadTime) : 0;
  }

  formatArabicDate(timestamp: string | number): string {
    const now = Date.now();
    const diffMs = now - Number(timestamp);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'الآن';
    else if (diffMin < 60)
      return `منذ ${this.getArabicTimeForm(
        diffMin,
        'دقيقة',
        'دقيقتين',
        'دقائق'
      )}`;
    else if (diffHour < 24)
      return `منذ ${this.getArabicTimeForm(
        diffHour,
        'ساعة',
        'ساعتين',
        'ساعات'
      )}`;
    else if (diffDay < 7)
      return `منذ ${this.getArabicTimeForm(diffDay, 'يوم', 'يومين', 'أيام')}`;

    return this.percisedArabicDate(timestamp);
  }

  private getArabicTimeForm(
    n: number,
    singular: string,
    dual: string,
    plural: string
  ): string {
    if (n === 1) return singular; // eg. ساعة
    else if (n === 2) return dual; // eg. ساعتين
    else return `${n} ${plural}`; // eg. 3 ساعات
  }

  percisedArabicDate(timestamp: string | number): string {
    return new Intl.DateTimeFormat('ar-EG', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(Number(timestamp)));
  }

  excludeExtension(filename: string): string {
    return filename.replace(/\.[^/.]+$/, ''); // Removes the extension
  }

  getFileName(fileId: string): string {
    const file = this.files.find((f) => f.id === fileId);
    return file ? file.filename : 'ملف غير موجود';
  }

  getFileTypeIcon(fileId: string): string {
    const file = this.files.find((f) => f.id === fileId);
    if (!file) return 'ri-file-line'; // Default icon if file not found

    const ext = file.filename.split('.').pop()?.toLowerCase();
    const videoExts = ['mp4', 'avi', 'mov', 'mkv'];
    const audioExts = ['mp3', 'wav', 'aac', 'ogg'];

    if (videoExts.includes(ext ?? '')) return 'ri-video-line';
    if (audioExts.includes(ext ?? '')) return 'ri-music-line';
    return 'ri-file-line';
  }

  ngOnInit() {
    this.fileuploadService.getFiles();
    this.filesSub = this.fileuploadService
      .getFilesUpdateListener()
      .subscribe((filesData: any) => {
        this.transcriptions = [];
        this.files = filesData;

        // sort files by uploadTime in descending order
        this.files.sort((a, b) => Number(b.uploadTime) - Number(a.uploadTime));

        this.transcriptions = filesData.map((file: { id: any }) => ({
          id: '',
          fileId: file.id,
          enhancedPath: '',
          status: 'pending',
          segments: [],
          isHovered: false,
        }));

        this.dataSource = new MatTableDataSource(this.transcriptions);
        this.updatePaginatedTranscriptions(0, 5); // initialize first page
      });
  }

  ngOnDestroy() {
    this.filesSub?.unsubscribe();
  }
}
