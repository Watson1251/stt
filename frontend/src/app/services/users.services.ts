import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Subject, throwError } from "rxjs";

import { User } from "../models/user.model";
import { catchError } from "rxjs/operators";
import { SnackbarService } from "./snackbar.service";
import { EnvironmentService } from "./environment.service";

@Injectable({ providedIn: "root" })
export class UsersService {

  private users: User[] = [];
  private usersUpdated = new Subject<any>();

  constructor(
    private http: HttpClient,
    private envService: EnvironmentService, 
    private snackbarService: SnackbarService
  ) {}

  getUsers() {
    this.http
      .get<{message: string, users: any}>(
        this.envService.apiUrl('users/'),
        {observe: 'response'}
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

            var fetchedUsers = response.body.users;
            var tempUsers: User[] = [];

            fetchedUsers.forEach((item: any) => {
                const user: User = {
                    id: item._id,
                    name: item.name,
                    username: item.username,
                    roleId: item.roleId,
                }
                tempUsers.push(user);
            });

            this.users = tempUsers;
            this.usersUpdated.next(this.users);
        }
      });
  }

  getUser(id: string) {
    return this.http
      .get<any>(
        this.envService.apiUrl(`users/${id}/`),
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      );
  }

  createUser(user: User) {
    return this.http
      .post<any>(
        this.envService.apiUrl('users/create/'),
        user,
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      );
  }

  updateUser(user: User) {
    return this.http
      .post<any>(
        this.envService.apiUrl('users/update/'),
        user,
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      );
  }

  deleteUser(user: User) {
    return this.http
      .post<any>(
        this.envService.apiUrl('users/delete/'),
        user,
        {observe: 'response'}
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

  getUsersUpdateListener() {
    return this.usersUpdated.asObservable();
  }

}
