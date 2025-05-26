import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Subject, throwError } from "rxjs";

import { catchError } from "rxjs/operators";
import { SnackbarService } from "./snackbar.service";
import { Tweet } from "../models/tweet.model";
import { EnvironmentService } from "./environment.service";

@Injectable({ providedIn: "root" })
export class TweetsService {

  private tweets: Tweet[] = [];
  private tweetsUpdated = new Subject<any>();

  constructor(
    private http: HttpClient,
    private envService: EnvironmentService, 
    private snackbarService: SnackbarService
  ) { }

  getTweets() {
    this.http
      .get<{ message: string, tweets: any }>(
        this.envService.apiUrl('tweets/'),
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

          var fetchedTweets = response.body.tweets;
          var tempTweets: Tweet[] = [];

          fetchedTweets.forEach((item: any) => {
            const tweet: Tweet = {
              id: item._id,
              tweet: item.tweet,
              categoryId: item.categoryId,
              isConsumed: item.isConsumed
            };
            tempTweets.push(tweet);
          });

          this.tweets = tempTweets;
          this.tweetsUpdated.next(this.tweets);
        }
      });
  }

  createTweet(tweet: Tweet) {
    return this.http
      .post<any>(
        this.envService.apiUrl('tweets/create/'),
        tweet,
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  updateTweet(tweet: Tweet) {
    return this.http
      .post<any>(
        this.envService.apiUrl('tweets/update/'),
        tweet,
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  deleteTweet(tweet: Tweet) {
    return this.http
      .post<any>(
        this.envService.apiUrl('tweets/delete/'),
        tweet,
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

  getTweetsUpdateListener() {
    return this.tweetsUpdated.asObservable();
  }

}
