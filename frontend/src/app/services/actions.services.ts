import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Subject, throwError } from "rxjs";

import { catchError } from "rxjs/operators";
import { SnackbarService } from "./snackbar.service";
import { Action } from "../models/action.model";
import { EnvironmentService } from "./environment.service";

@Injectable({ providedIn: "root" })
export class ActionsService {

  private actions: Action[] = [];
  private actionsUpdated = new Subject<any>();

  constructor(
    private http: HttpClient,
    private envService: EnvironmentService,
    private snackbarService: SnackbarService
  ) {

  }

  getScreenshotUrl(taskId: string, stage: string): Promise<string> {
    const baseUrl = this.envService.apiUrl('actions/screenshot/');
    const params = {
      task_id: taskId,
      stage_name: stage
    };

    return this.http.get(baseUrl, {
      params,
      responseType: 'blob',
    }).toPromise().then((blob: Blob | undefined) => {
      if (!blob) {
        throw new Error('Blob is undefined');
      }
      return URL.createObjectURL(blob); // ready to bind to <img [src]>
    }).catch((error: HttpErrorResponse) => {
      // this.snackbarService.openSnackBar('فشل تحميل لقطة الشاشة', 'failure');
      return '';
    });
  }

  uploadMedia(formData: FormData) {
    return this.http.post<{ mediaUrl: string }>(
      this.envService.apiUrl('actions/upload-media/'),
      formData,
      { observe: 'response' }
    ).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  getActions() {
    this.http
      .get<{ message: string, actions: any }>(
        this.envService.apiUrl('actions/'),
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      )
      .subscribe(response => {
        if (response.status == 200 || response.status == 201) {
          if (response.body == null) {
            return;
          }

          var fetchedActions = response.body.actions;
          var tempActions: Action[] = [];

          fetchedActions.forEach((item: any) => {
            const action: Action = {
              id: item._id,
              action: item.action,
              deviceId: item.deviceId,
              accountId: item.accountId,
              timestamp: Number(item.timestamp),
              isFinished: item.isFinished,
              status: item.status,
              taskId: item.taskId,
              categoryId: item.categoryId,
              tweetId: item.tweetId,
              targetTweetId: item.targetTweetId,
              mediaUrl: item.mediaUrl,
              hashtag: item.hashtag,
            };
            tempActions.push(action);
          });

          this.actions = tempActions;
          this.actionsUpdated.next(this.actions);
        }
      });
  }

  getAction(action: Action) {
    return this.http
      .get<any>(
        this.envService.apiUrl(`actions/${action.id}`),
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  sendAction(action: Action) {
    return this.http
      .post<any>(
        this.envService.apiUrl('actions/send/'),
        action,
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  createAction(action: Action) {
    return this.http
      .post<any>(
        this.envService.apiUrl('actions/create/'),
        action,
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  createActions(actions: Action[]) {
    return this.http
      .post<any>(
        this.envService.apiUrl('actions/create-many/'),
        actions,
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  updateAction(action: Action) {
    return this.http
      .post<any>(
        this.envService.apiUrl('actions/update/'),
        action,
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  deleteAction(action: Action) {
    return this.http
      .post<any>(
        this.envService.apiUrl('actions/delete/'),
        action,
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  handleError(error: HttpErrorResponse) {
    var message = '';

    // Client-side error occurred
    if (error.error instanceof ErrorEvent) {
      message = 'حدث خطأ في العميل.';

      // Server-side error occurred
    } else {
      message = 'حدث خطأ في المزود.';
    }

    if (error.error.message) {
      message += "\n";
      message += error.error.message;
    }

    this.snackbarService.openSnackBar(message, 'failure');
    return throwError(message);
  }

  getActionsUpdateListener() {
    return this.actionsUpdated.asObservable();
  }

}
