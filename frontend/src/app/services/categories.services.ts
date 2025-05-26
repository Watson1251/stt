import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Subject, throwError } from "rxjs";

import { catchError } from "rxjs/operators";
import { SnackbarService } from "./snackbar.service";
import { Category } from "../models/category.model";
import { EnvironmentService } from "./environment.service";

@Injectable({ providedIn: "root" })
export class CategoriesService {

  private categories: Category[] = [];
  private categoriesUpdated = new Subject<any>();

  constructor(
    private http: HttpClient,
    private envService: EnvironmentService,
    private snackbarService: SnackbarService
  ) { }

  getCategories() {
    this.http
      .get<{ message: string, categories: any }>(
        this.envService.apiUrl('categories/'),
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

          var fetchedCategories = response.body.categories;
          var tempCategories: Category[] = [];

          fetchedCategories.forEach((item: any) => {
            const category: Category = {
              id: item._id,
              category: item.category,
            };
            tempCategories.push(category);
          });

          this.categories = tempCategories;
          this.categoriesUpdated.next(this.categories);
        }
      });
  }

  createCategory(category: Category) {
    return this.http
      .post<any>(
        this.envService.apiUrl('categories/create/'),
        category,
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  updateCategory(category: Category) {
    return this.http
      .post<any>(
        this.envService.apiUrl('categories/update/'),
        category,
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  deleteCategory(category: Category) {
    return this.http
      .post<any>(
        this.envService.apiUrl('categories/delete/'),
        category,
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

  getCategoriesUpdateListener() {
    return this.categoriesUpdated.asObservable();
  }

}
