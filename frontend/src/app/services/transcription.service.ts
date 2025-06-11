import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, Subject, throwError } from "rxjs";

import { environment } from "../../environments/environment";
import { catchError } from "rxjs/operators";
import { TranscriptionModel } from "../models/transcription.model";
import { SnackbarService } from "./snackbar.service";

const BACKEND_URL = environment.apiUrl + '/transcription/';

@Injectable({ providedIn: "root" })
export class TranscriptionsService {

    private transcriptions: TranscriptionModel[] = [];
    private transcriptionsUpdated = new Subject<any>();

    constructor(private http: HttpClient,
        private snackbarService: SnackbarService) { }

    getTranscriptions() {
        this.http
            .get<{ message: string, transcriptions: any }>(
                BACKEND_URL,
                { observe: 'response' }
            )
            .pipe(
                catchError((error: HttpErrorResponse) => {
                    return this.handleError(error);
                })
            )
            .subscribe((response: any) => {
                if (response.status == 200 || response.status == 201) {
                    if (response.body == null) {
                        return;
                    }

                    var fetchedTranscriptions = response.body.transcriptions;
                    var tempTranscriptions: TranscriptionModel[] = [];
                    console.log('Fetched Transcriptions:', fetchedTranscriptions);

                    fetchedTranscriptions.forEach((item: any) => {
                        const transcription: TranscriptionModel = {
                            id: item._id,
                            fileId: item.fileId,
                            enhancedPath: item.enhancedPath,
                            status: item.status,
                            segments: item.segments,
                        }
                        tempTranscriptions.push(transcription);
                    });

                    this.transcriptions = tempTranscriptions;
                    this.transcriptionsUpdated.next(this.transcriptions);
                }
            });
    }

    getTranscription(id: string) {
        return this.http
            .get<any>(
                BACKEND_URL + id,
                { observe: 'response' }
            )
            .pipe(
                catchError((error: HttpErrorResponse) => {
                    return this.handleError(error);
                })
            );
    }

    createTranscription(transcription: Partial<TranscriptionModel>) {
        return this.http
            .post<any>(
                BACKEND_URL + 'create/',
                transcription,
                { observe: 'response' }
            )
            .pipe(
                catchError((error: HttpErrorResponse) => {
                    return this.handleError(error);
                })
            );
    }

    updateTranscription(id: string, transcription: Partial<TranscriptionModel>) {
        return this.http
            .put<any>(BACKEND_URL + id, transcription, { observe: 'response' })
            .pipe(
                catchError((error: HttpErrorResponse) => {
                    return this.handleError(error);
                })
            );
    }

    deleteTranscription(id: string) {
        return this.http
            .delete<any>(BACKEND_URL + id, { observe: 'response' })
            .pipe(
                catchError((error: HttpErrorResponse) => {
                    return this.handleError(error);
                })
            );
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

    getTranscriptionsUpdateListener() {
        return this.transcriptionsUpdated.asObservable();
    }

}