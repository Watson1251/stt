import { Subscription } from 'rxjs';
import { NgFor, CommonModule, } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, signal, } from '@angular/core';
import {
  BorderDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  CardTextDirective,
  CardTitleDirective,
  ColComponent,
  RowComponent,
  AvatarComponent,
  ButtonGroupComponent,
  CardFooterComponent,
  FormCheckLabelDirective,
  GutterDirective,
  ProgressBarDirective,
  ProgressComponent,
  TableDirective,
  TextColorDirective,
  RoundedDirective,
  TabDirective,
  TabPanelComponent,
  TabsComponent,
  TabsContentComponent,
  TabsListComponent
} from '@coreui/angular';

import { FormsModule, Validators } from '@angular/forms';

import { DOCUMENT, NgStyle } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChartOptions } from 'chart.js';
import {
} from '@coreui/angular';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { IconDirective } from '@coreui/icons-angular';

import { WidgetsBrandComponent } from '../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDropdownComponent } from '../widgets/widgets-dropdown/widgets-dropdown.component';
import { Account } from '../../models/account.model';

import { PaginatorComponent } from '../paginator/paginator.component';
import { AngularMaterialModule } from '../../modules/angular-material.module';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

import { RouterModule } from '@angular/router';

import { Helper } from '../helpers';
import { SnackbarService } from '../../services/snackbar.service';
import { ConfirmComponent } from '../confirm/confirm.component';
import { MatDialog } from '@angular/material/dialog';
import { Tweet } from '../../models/tweet.model';
import { Category } from '../../models/category.model';

import { CategoriesService } from '../../services/categories.services';
import { TweetsService } from '../../services/tweets.services';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-tweets',
  imports: [
    RowComponent,
    NgFor,
    ColComponent,
    TextColorDirective,
    CardComponent,
    BorderDirective,
    CardHeaderComponent,
    CardBodyComponent,
    CardTitleDirective,
    CardTextDirective,
    ButtonDirective,
    CommonModule,
    PaginatorComponent,
    AngularMaterialModule,
    FormsModule,
    RouterModule,
    MatChipsModule,
    MatTooltipModule,
    MatIconModule,
    MatBadgeModule,

    WidgetsDropdownComponent,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    RowComponent,
    ColComponent,
    ButtonDirective,
    IconDirective,
    ReactiveFormsModule,
    ButtonGroupComponent,
    FormCheckLabelDirective,
    ChartjsComponent,
    NgStyle,
    CardFooterComponent,
    GutterDirective,
    ProgressBarDirective,
    ProgressComponent,
    WidgetsBrandComponent,
    CardHeaderComponent,
    TableDirective,
    AvatarComponent,
    RoundedDirective,
    TabDirective,
    TabPanelComponent,
    TabsComponent,
    TabsContentComponent,
    TabsListComponent
  ],
  templateUrl: './tweets.component.html',
  styleUrl: './tweets.component.scss'
})
export class TweetsComponent implements OnInit, OnDestroy {

  public activeItem: number = 0; // Ensure it's a number

  Helper = Helper;

  isTweetsLoaded: boolean = false;
  isCategoriesLoaded: boolean = false;

  allTweets: Tweet[] = [];
  tweets: Tweet[] = [];
  paginatedTweets: Tweet[] = [];
  selectedTweet: Tweet | null = null;

  categories: Category[] = [];
  selectedCategory: Category | null = null;

  selectedStatus: string = '';

  tweetFormValidator: FormGroup = new FormGroup({
    category: new FormControl('', [Validators.required]),
    tweet: new FormControl('', [Validators.required]),
  });

  categoryFormValidator: FormGroup = new FormGroup({
    category: new FormControl('', [Validators.required]),
  });

  isSubmit = true;
  isDelete = true;

  titleLabel = 'اختر تغريدة من القائمة!';
  submitButton = 'إضافة';
  deleteButton = 'حذف';

  tweetLabel = 'التغريدة';
  categoryLabel = 'فئة التغريدة';

  tweetError = 'الرجاء كتابة التغريدة';
  categoryError = 'الرجاء اختيار فئة التغريدة';

  private tweetsSub?: Subscription;
  private categoriesSub?: Subscription;

  constructor(
    public tweetsService: TweetsService,
    public categoriesService: CategoriesService,
    private snackbarService: SnackbarService,

    public dialog: MatDialog // Inject MatDialog
  ) { }

  onAddTweet() {
    this.titleLabel = "إضافة تغريدة جديدة";
    this.submitButton = 'إضافة';

    const tweet: Tweet = {
      id: '',
      tweet: '-',
      categoryId: this.selectedCategory?.id || '',
      isConsumed: false
    }

    this.selectedTweet = tweet;
    this.selectedStatus = 'tweet';

    this.tweetFormValidator.patchValue({
      category: this.selectedCategory,
      tweet: '',
    });
  }

  onAddCategory() {
    this.titleLabel = "إضافة فئة جديدة";
    this.submitButton = 'إضافة';

    const category: Category = {
      id: '',
      category: '-',
    }

    this.selectedCategory = category;
    this.selectedStatus = 'category';

    this.categoryFormValidator.patchValue({
      category: '',
    });
  }

  openConfirmationDialog(title: string, message: string, type: 'info' | 'danger'): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmComponent, {
      width: '400px',
      height: 'auto',
      panelClass: 'custom-dialog', // Custom class to apply styles globally
      data: {
        title,
        message,
        icon: type === 'info' ? 'info' : 'warning',
        iconClass: type === 'info' ? 'info-icon' : 'danger-icon',
        confirmButtonColor: type === 'info' ? 'primary' : 'warn',
        confirmButtonText: type === 'info' ? 'تأكيد' : 'حذف'
      }
    });

    return dialogRef.afterClosed().toPromise();
  }

  async deleteCategory() {

    const confirmed = await this.openConfirmationDialog(
      'تأكيد الحذف',
      'هل أنت متأكد أنك تريد حذف هذه الفئة؟',
      'danger'
    );

    if (!confirmed) {
      return;
    }

    if (!this.selectedCategory) {
      return;
    }

    this.categoriesService.deleteCategory(this.selectedCategory).subscribe(response => {
      if (response.status == 200 || response.status == 201) {

        // // make a clone of selectedAccount
        // const account = { ...this.selectedAccount };

        // // loop through devices and update their account id
        // this.devices.forEach(device => {
        //   // check if account.id is within device.accounts
        //   if (account && account.id && device.accounts.includes(account.id)) {
        //     // remove account.id from device.accounts
        //     device.accounts = device.accounts.filter(accountId => accountId !== account?.id);
        //     // update device
        //     this.devicesService.updateDevice(device).subscribe(response => {
        //     });
        //   }
        // });


        this.categoriesService.getCategories();
        this.snackbarService.openSnackBar('تم حذف الفئة بنجاح.', 'success');

        // reset
        this.selectedTweet = null;
        this.selectedCategory = null;
        this.tweetFormValidator.reset();
        this.categoryFormValidator.reset();
        this.titleLabel = 'اختر تغريدة من القائمة!';
        this.selectedStatus = '';
        this.submitButton = 'إضافة';

        if (this.tweets.length == 0) {
          this.titleLabel = 'لا توجد تغريدات مسجلة';
        }
      }
    });
  }

  async deleteTweet() {

    const confirmed = await this.openConfirmationDialog(
      'تأكيد الحذف',
      'هل أنت متأكد أنك تريد حذف هذه التغريدة؟',
      'danger'
    );

    if (!confirmed) {
      return;
    }

    if (!this.selectedTweet) {
      return;
    }

    this.tweetsService.deleteTweet(this.selectedTweet).subscribe(response => {
      if (response.status == 200 || response.status == 201) {

        // // make a clone of selectedAccount
        // const account = { ...this.selectedAccount };

        // // loop through devices and update their account id
        // this.devices.forEach(device => {
        //   // check if account.id is within device.accounts
        //   if (account && account.id && device.accounts.includes(account.id)) {
        //     // remove account.id from device.accounts
        //     device.accounts = device.accounts.filter(accountId => accountId !== account?.id);
        //     // update device
        //     this.devicesService.updateDevice(device).subscribe(response => {
        //     });
        //   }
        // });


        this.tweetsService.getTweets();
        this.snackbarService.openSnackBar('تم حذف التغريدة بنجاح.', 'success');

        // reset
        this.selectedTweet = null;
        this.selectedCategory = null;
        this.tweetFormValidator.reset();
        this.categoryFormValidator.reset();
        this.titleLabel = 'اختر تغريدة من القائمة!';
        this.selectedStatus = '';
        this.submitButton = 'إضافة';

        if (this.tweets.length == 0) {
          this.titleLabel = 'لا توجد تغريدات مسجلة';
        }
      }
    });
  }

  async editCategory() {

    if (this.isInvalid('all', this.categoryFormValidator) || this.categoryFormValidator.value == null || !this.isFormChanged()) {
      return;
    }

    const confirmed = await this.openConfirmationDialog(
      'تأكيد التعديل',
      'هل أنت متأكد أنك تريد حفظ التغييرات على هذه الفئة؟',
      'info'
    );

    if (!confirmed) {
      return;
    }

    const category: Category = {
      id: this.selectedCategory?.id || '',
      category: this.categoryFormValidator.get("category")?.value,
    }

    this.categoriesService.updateCategory(category).subscribe(response => {
      if (response.status == 200 || response.status == 201) {
        this.categoriesService.getCategories();
        this.snackbarService.openSnackBar('تم تحديث بيانات الفئة بنجاح.', 'success');

        // reset
        this.selectedTweet = null;
        this.selectedCategory = null;
        this.tweetFormValidator.reset();
        this.categoryFormValidator.reset();
        this.titleLabel = 'اختر تغريدة من القائمة!';
        this.selectedStatus = '';
        this.submitButton = 'إضافة';

        if (this.tweets.length == 0) {
          this.titleLabel = 'لا توجد تغريدات مسجلة';
        }
      }
    });
  }

  async editTweet() {

    if (this.isInvalid('all', this.tweetFormValidator) || this.tweetFormValidator.value == null || !this.isFormChanged()) {
      return;
    }

    const confirmed = await this.openConfirmationDialog(
      'تأكيد التعديل',
      'هل أنت متأكد أنك تريد حفظ التغييرات على هذه التغريدة؟',
      'info'
    );

    if (!confirmed) {
      return;
    }

    const tweet: Tweet = {
      id: this.selectedTweet?.id ?? '',
      tweet: this.tweetFormValidator.get("tweet")?.value,
      categoryId: this.tweetFormValidator.get("category")?.value.id,
      isConsumed: this.selectedTweet?.isConsumed ?? false,
    }

    this.tweetsService.updateTweet(tweet).subscribe(response => {
      if (response.status == 200 || response.status == 201) {
        this.tweetsService.getTweets();
        this.snackbarService.openSnackBar('تم تحديث التغريدة بنجاح.', 'success');

        // reset
        this.selectedTweet = null;
        this.selectedCategory = null;
        this.tweetFormValidator.reset();
        this.categoryFormValidator.reset();
        this.titleLabel = 'اختر تغريدة من القائمة!';
        this.selectedStatus = '';
        this.submitButton = 'إضافة';

        if (this.tweets.length == 0) {
          this.titleLabel = 'لا توجد تغريدات مسجلة';
        }
      }
    });
  }

  addCategory() {

    if (this.isInvalid('all', this.categoryFormValidator) || this.categoryFormValidator.value == null || !this.isFormChanged()) {
      return;
    }

    const category: Category = {
      id: '',
      category: this.categoryFormValidator.get("category")?.value,
    }

    this.categoriesService.createCategory(category).subscribe(response => {
      if (response.status == 200 || response.status == 201) {
        this.categoriesService.getCategories();
        this.snackbarService.openSnackBar('تم إضافة فئة جديدة بنجاح.', 'success');

        // reset
        this.selectedTweet = null;
        this.selectedCategory = null;
        this.tweetFormValidator.reset();
        this.categoryFormValidator.reset();
        this.titleLabel = 'اختر تغريدة من القائمة!';
        this.selectedStatus = '';
        this.submitButton = 'إضافة';

        if (this.tweets.length == 0) {
          this.titleLabel = 'لا توجد تغريدات مسجلة';
        }
      }
    });

  }

  addTweet() {

    if (this.isInvalid('all', this.tweetFormValidator) || this.tweetFormValidator.value == null || !this.isFormChanged()) {
      return;
    }

    const tweet: Tweet = {
      id: '',
      tweet: this.tweetFormValidator.get("tweet")?.value,
      categoryId: this.tweetFormValidator.get("category")?.value.id,
      isConsumed: false
    }

    this.tweetsService.createTweet(tweet).subscribe(response => {
      if (response.status == 200 || response.status == 201) {
        this.tweetsService.getTweets();
        this.snackbarService.openSnackBar('تم إضافة التغريدة بنجاح.', 'success');

        // reset
        this.selectedTweet = null;
        this.selectedCategory = null;
        this.tweetFormValidator.reset();
        this.categoryFormValidator.reset();
        this.titleLabel = 'اختر تغريدة من القائمة!';
        this.selectedStatus = '';
        this.submitButton = 'إضافة';

        if (this.tweets.length == 0) {
          this.titleLabel = 'لا توجد تغريدات مسجلة';
        }
      }
    });

  }

  onSubmit() {
    if (!this.isSubmit) {
      return;
    }

    if (this.submitButton == 'إضافة') {
      if (this.selectedStatus === "tweet") {
        this.addTweet();
      } else if (this.selectedStatus === "category") {
        this.addCategory();
      }
    } else {
      if (this.selectedStatus === "tweet") {
        this.editTweet();
      } else if (this.selectedStatus === "category") {
        this.editCategory();
      }
    }
  }

  onDelete() {
    if (!this.isDelete) {
      return;
    }


    if (this.selectedStatus === "tweet") {
      this.deleteTweet();
    } else if (this.selectedStatus === "category") {
      this.deleteCategory();
    }
  }

  isFormChanged(): boolean {
    if (!this.selectedTweet && !this.selectedCategory) return false;

    if (this.selectedStatus === 'tweet') {
      return (
        this.tweetFormValidator.get('tweet')?.value !== this.selectedTweet?.tweet ||
        JSON.stringify(this.tweetFormValidator.get('category')?.value.id) !== JSON.stringify(this.selectedTweet?.categoryId)
      );
    } else if (this.selectedStatus === 'category') {
      return this.categoryFormValidator.get('category')?.value !== this.selectedCategory?.category;
    }

    return false;
  }

  isSubmitDisabled(): boolean {
    if (!this.selectedStatus) return true; // Disable if no tweet/category selected

    const form = this.selectedStatus === "tweet" ? this.tweetFormValidator : this.categoryFormValidator;

    return !this.isFormChanged() || form.invalid;
  }

  isDeleteEnabled(): boolean {
    return this.selectedTweet !== null || this.selectedCategory !== null;
  }


  isInvalid(formName: string, formValidator: FormGroup): boolean {
    if (!formValidator) {
      return true;
    }

    formValidator.updateValueAndValidity();

    if (!this.isFormChanged()) {
      return false;
    }

    if (formName == 'all') {

      if (formValidator.invalid || formValidator.value == null) {
        return true;
      }

    } else {

      if (formValidator.get(formName)?.invalid || formValidator.get(formName)?.value == null) {
        return true;
      }

    }

    return false;
  }

  onCategoryEdit(category: Category | null): void {
    this.resetSelections(); // Ensure no conflicting selections
    this.selectedCategory = category;
    this.selectedStatus = 'category';

    if (!category) {
      this.submitButton = 'إضافة';
      this.titleLabel = 'اختر تغريدة من القائمة!';
      this.categoryFormValidator.reset();
      return;
    }

    this.categoryFormValidator.patchValue({ category: category.category });
    this.submitButton = 'تحديث';
    this.titleLabel = 'تعديل بيانات فئة التغريدة';
  }

  resetSelections(): void {
    this.selectedTweet = null;
    this.selectedCategory = null;
    this.tweetFormValidator.reset();
    this.categoryFormValidator.reset();
  }

  // Set initial values when selecting a account
  updateSelectedTweet(tweet: Tweet | null): void {
    this.selectedTweet = tweet;
    this.selectedStatus = 'tweet';

    if (!tweet) {
      this.submitButton = 'إضافة';
      this.titleLabel = 'اختر تغريدة من القائمة!';
      this.selectedStatus = '';
      this.resetSelections();
      return;
    }

    const category = this.categories.find(cat => cat.id === tweet.categoryId) || null;

    this.tweetFormValidator.patchValue({
      tweet: tweet.tweet ? tweet.tweet : '',
      category: category,
    });

    this.tweetFormValidator.markAsPristine();  // Mark form as unchanged
    this.tweetFormValidator.markAsUntouched(); // Mark form as untouched

    this.submitButton = 'تحديث';
    this.titleLabel = 'تعديل بيانات التغريدة';
  }

  onTabChange(event: string | number | undefined) {
    this.activeItem = typeof event === 'number' ? event : 0;
    this.resetSelections();
    this.submitButton = 'إضافة';
    this.titleLabel = 'اختر تغريدة من القائمة!';
    this.selectedStatus = '';
    this.updateTweets();

    if (this.tweets.length == 0) {
      this.titleLabel = 'لا توجد تغريدات مسجلة';
    }
  }

  // Select device when clicking on row
  onRowClick(tweet: Tweet, event?: Event): void {
    if (event) {
      event.stopPropagation(); // Prevents the row click event when clicking the checkbox
    }
    const result = this.selectedTweet === tweet ? null : tweet;
    this.updateSelectedTweet(result);
  }

  // Separate method for checkbox selection
  onCheckboxChange(event: MatCheckboxChange, tweet: Tweet): void {
    event.source.checked = event.checked; // Ensure checkbox reflects its state
    const result = event.checked ? tweet : null;
    this.updateSelectedTweet(result);
  }

  ngOnInit(): void {
    this.tweetsService.getTweets();
    this.tweetsSub = this.tweetsService.getTweetsUpdateListener().subscribe((tweetsData: any) => {
      this.allTweets = tweetsData;
      this.isTweetsLoaded = true;
      this.updateTweets();
    });

    this.categoriesService.getCategories();
    this.categoriesSub = this.categoriesService.getCategoriesUpdateListener().subscribe((categoriesData: any) => {
      this.categories = categoriesData;
      this.isCategoriesLoaded = true;
      this.updateTweets();
    });
  }

  updateTweets() {
    if (!this.isTweetsLoaded || !this.isCategoriesLoaded) {
      return;
    }

    // select the category at activeItem index
    if (this.activeItem < this.categories.length) {
      this.selectedCategory = this.categories[this.activeItem];
    }

    // filter tweets to show only the selected category
    if (this.selectedCategory) {
      this.tweets = this.allTweets.filter(tweet => this.selectedCategory && tweet.categoryId === this.selectedCategory.id);
    }

    if (this.tweets.length == 0) {
      this.titleLabel = 'لا توجد تغريدات مسجلة';
    }
  }

  getTweetCount(categoryId: string): number {
    return this.allTweets.filter(tweet => tweet.categoryId === categoryId).length;
  }


  ngOnDestroy(): void {
    this.tweetsSub?.unsubscribe();
    this.categoriesSub?.unsubscribe();
  }

}
