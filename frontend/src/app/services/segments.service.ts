import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, Subject, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

import { environment } from "../../environments/environment";
import { SegmentModel } from "../models/transcription.model";
import { SnackbarService } from "./snackbar.service";

const BACKEND_URL = environment.apiUrl + '/segment/';

@Injectable({ providedIn: "root" })
export class SegmentsService {

    private segments: SegmentModel[] = [];
    private segmentsUpdated = new Subject<SegmentModel[]>();

    constructor(private http: HttpClient,
        private snackbarService: SnackbarService) { }

    getSegments() {
        this.http
            .get<{ message: string, segments: any }>(
                BACKEND_URL,
                { observe: 'response' }
            )
            .pipe(
                catchError((error: HttpErrorResponse) => {
                    return this.handleError(error);
                })
            )
            .subscribe((response: any) => {
                if (response.status === 200 || response.status === 201) {
                    if (!response.body) return;

                    const fetchedSegments = response.body.segments;
                    const tempSegments: SegmentModel[] = [];

                    fetchedSegments.forEach((item: any) => {
                        const segment: SegmentModel = {
                            id: item._id,
                            path: item.path,
                            start: item.start,
                            end: item.end,
                            text: item.text || '',
                            status: item.status,
                            suggestions: item.suggestions || [],
                            editedText: item.editedText || '',
                            speaker: item.speaker,
                            confidence: item.confidence
                        };
                        tempSegments.push(segment);
                    });

                    this.segments = tempSegments;
                    this.segmentsUpdated.next(this.segments);
                }
            });
    }

    getSegment(id: string) {
        return this.http
            .get<any>(BACKEND_URL + id, { observe: 'response' })
            .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
    }

    createSegment(segment: Partial<SegmentModel>) {
        return this.http
            .post<any>(BACKEND_URL + 'create/', segment, { observe: 'response' })
            .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
    }

    updateSegment(id: string, segment: Partial<SegmentModel>) {
        return this.http
            .put<any>(BACKEND_URL + id, segment, { observe: 'response' })
            .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
    }

    deleteSegment(id: string) {
        return this.http
            .delete<any>(BACKEND_URL + id, { observe: 'response' })
            .pipe(catchError((error: HttpErrorResponse) => this.handleError(error)));
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

    getSegmentsUpdateListener() {
        return this.segmentsUpdated.asObservable();
    }

}
