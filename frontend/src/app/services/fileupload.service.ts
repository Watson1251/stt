import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpHeaders,
  HttpResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SnackbarService } from './snackbar.service';
import { environment } from '../../environments/environment';

const BACKEND_URL = environment.apiUrl + '/file-upload/';

export interface UploadProgressResult {
  progress: number;
  result?: any;
}

@Injectable({
  providedIn: 'root',
})
export class FileuploadService {
  constructor(
    private http: HttpClient,
    private snackbarService: SnackbarService
  ) {}

  getAllFiles(): Observable<any[]> {
    return this.http.get<{ files: any[] }>(BACKEND_URL).pipe(
      map((response) => response.files),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  upload(file: File): Observable<UploadProgressResult> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    return this.http
      .post<any>(BACKEND_URL + '', formData, {
        observe: 'events',
        reportProgress: true,
      })
      .pipe(
        map((event) => this.getEventMessage(event)),
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }

  private getEventMessage(event: HttpEvent<any>): UploadProgressResult {
    const result: UploadProgressResult = {
      progress: 0,
    };

    switch (event.type) {
      case HttpEventType.UploadProgress:
        result.progress = event.total
          ? Math.round((100 * event.loaded) / event.total)
          : 0;
        break;

      case HttpEventType.Response:
        result.progress = 100;
        if (event instanceof HttpResponse) {
          // Use `.files[0]` if your backend returns an array
          result.result = event.body?.file || event.body?.files?.[0];
        }
        break;
    }

    return result;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = '';

    if (error.error instanceof ErrorEvent) {
      message = 'حدث خطأ في العميل.';
    } else {
      message = 'حدث خطأ في المزود.';
    }

    if (error.error?.message) {
      message += '\n' + error.error.message;
    }

    this.snackbarService.openSnackBar(message, 'failure');
    return throwError(() => new Error(message));
  }
}
