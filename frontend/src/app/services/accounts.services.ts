import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Subject, throwError } from "rxjs";

import { catchError } from "rxjs/operators";
import { SnackbarService } from "./snackbar.service";
import { Account } from "../models/account.model";
import { EnvironmentService } from "./environment.service";

@Injectable({ providedIn: "root" })
export class AccountsService {

  private accounts: Account[] = [];
  private accountsUpdated = new Subject<any>();

  constructor(
    private http: HttpClient,
    private envService: EnvironmentService,
    private snackbarService: SnackbarService
  ) { }

  getAccounts() {
    this.http
      .get<{ message: string, accounts: any }>(
        this.envService.apiUrl('accounts/'),
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

          var fetchedAccounts = response.body.accounts;
          var tempAccounts: Account[] = [];

          fetchedAccounts.forEach((item: any) => {
            const account: Account = {
              id: item._id,
              name: item.name,
              username: item.username,
              showFullName: false
            };
            tempAccounts.push(account);
          });

          this.accounts = tempAccounts;
          this.accountsUpdated.next(this.accounts);
        }
      });
  }

  createAccount(account: Account) {
    return this.http
      .post<any>(
        this.envService.apiUrl('accounts/create/'),
        account,
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  updateAccount(account: Account) {
    return this.http
      .post<any>(
        this.envService.apiUrl('accounts/update/'),
        account,
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  deleteAccount(account: Account) {
    return this.http
      .post<any>(
        this.envService.apiUrl('accounts/delete/'),
        account,
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

  getAccountsUpdateListener() {
    return this.accountsUpdated.asObservable();
  }

}
