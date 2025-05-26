import { Subscription } from 'rxjs';
import { NgFor, CommonModule, } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, EventEmitter, Output, } from '@angular/core';
import { v4 as uuidv4 } from 'uuid'; // UUID for unique action IDs
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
  TextColorDirective
} from '@coreui/angular';

import { FormsModule, Validators } from '@angular/forms';

import { DOCUMENT, NgStyle } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChartOptions } from 'chart.js';
import {
} from '@coreui/angular';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { IconDirective } from '@coreui/icons-angular';

import { WidgetsBrandComponent } from '../../widgets/widgets-brand/widgets-brand.component';
import { WidgetsDropdownComponent } from '../../widgets/widgets-dropdown/widgets-dropdown.component';
import { Account } from '../../../models/account.model';

import { PaginatorComponent } from '../../paginator/paginator.component';
import { AngularMaterialModule } from '../../../modules/angular-material.module';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

import { RouterModule } from '@angular/router';

import { Helper } from '../../helpers';
import { SnackbarService } from '../../../services/snackbar.service';
import { AccountsService } from '../../../services/accounts.services';
import { ConfirmComponent } from '../../confirm/confirm.component';
import { MatDialog } from '@angular/material/dialog';
import { DevicesService } from '../../../services/devices.services';
import { TweetsService } from '../../../services/tweets.services';
import { CategoriesService } from '../../../services/categories.services';
import { Device } from '../../../models/device.model';
import { Tweet } from '../../../models/tweet.model';
import { Category } from '../../../models/category.model';
import { Action } from '../../../models/action.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { ActionsService } from '../../../services/actions.services';
import { OwlDateTimeModule, OwlNativeDateTimeModule, OWL_DATE_TIME_LOCALE, OwlDateTimeIntl, DateTimeAdapter } from '@danielmoncada/angular-datetime-picker';
import { MatFormFieldModule } from '@angular/material/form-field';

import { ArabicNativeDateTimeAdapter } from './arabic-native-date-time-adapter';

import { Directionality } from '@angular/cdk/bidi';
import { Subject } from 'rxjs';
import { formatDate } from '@angular/common';

export class ArabicIntl extends OwlDateTimeIntl {
  override upSecondLabel = 'زيادة ثانية';
  override downSecondLabel = 'تنقيص ثانية';
  override upMinuteLabel = 'زيادة دقيقة';
  override downMinuteLabel = 'تنقيص دقيقة';
  override upHourLabel = 'زيادة ساعة';
  override downHourLabel = 'تنقيص ساعة';
  override prevMonthLabel = 'الشهر السابق';
  override nextMonthLabel = 'الشهر القادم';
  override prevYearLabel = 'السنة السابقة';
  override nextYearLabel = 'السنة القادمة';
  override setBtnLabel = 'تأكيد'; // ✅ correct version of setToNowLabel
  confirmBtnLabel = 'تأكيد';
  override cancelBtnLabel = 'إلغاء';
  override rangeFromLabel = 'من';
  override rangeToLabel = 'إلى';
  override hour12AMLabel = 'ص';
  override hour12PMLabel = 'م';
}



@Component({
  selector: 'app-schedule',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
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

    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  providers: [
    { provide: DateTimeAdapter, useClass: ArabicNativeDateTimeAdapter },
    { provide: OWL_DATE_TIME_LOCALE, useValue: 'ar' },
    { provide: OwlDateTimeIntl, useClass: ArabicIntl },

    {
      provide: Directionality,
      useValue: {
        value: 'rtl',
        change: new Subject()
      }
    }
  ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss'
})
export class ScheduleComponent implements OnInit, OnDestroy {

  Helper = Helper;

  public selectedDate = new Date(2018, 3, 21, 20, 30);

  accounts: Account[] = [];
  tweets: Tweet[] = [];
  categories: Category[] = [];
  actions: Action[] = [];

  connectedDevices: Device[] = [];
  devices: Device[] = [];
  paginatedDevices: Device[] = [];

  TASK_STATUS_TRANSLATIONS: { [key: string]: string } = {
    "NOT_STARTED": "لم يبدأ بعد",
    "STARTED": "تمت الجدولة",
    "STARTING_SERVER": "جاري بدء الخادم",
    "STOPPING_TASK": "جاري إيقاف المهمة",
    "FAILED_STOPPING_TASK": "فشل في إيقاف المهمة",
    "TAKING_SCREENSHOT": "جاري التقاط لقطة شاشة",
    "SCREENSHOT_TAKEN": "تم التقاط لقطة شاشة",
    "UNLOCKING_DEVICE": "جاري إلغاء قفل الجهاز",
    "REFRESHING_TWEETS": "جاري تحديث التغريدات",
    "SWITCHING_ACCOUNT": "جاري تبديل الحساب",
    "KEEPING_SCREEN_ON": "جاري إبقاء الشاشة قيد التشغيل",
    "NAVIGATING_HOME_SCREEN": "جاري الانتقال إلى الشاشة الرئيسية",
    "CLICKING_TWEET_BUTTON": "جاري النقر على زر التغريد",
    "DOWNLOADING_IMAGE": "جاري تنزيل الصورة",
    "SELECTING_IMAGE": "جاري تحديد الصورة",
    "POSTING_TWEET": "جاري نشر التغريدة",
    "RESTORING_SCREEN_SETTINGS": "جاري استعادة إعدادات الشاشة",
    "STARTING_ACTIVITY": "جاري بدء النشاط",
    "RELAUNCHING_TWITTER": "جاري إعادة تشغيل تويتر",
    "CLICKING_REPLY_BUTTON": "جاري النقر على زر الرد",
    "SCROLLING": "جاري التمرير",
    "CLICKING_LIKE_BUTTON": "جاري النقر على زر الإعجاب",
    "CLICKING_REPOST_BUTTON": "جاري النقر على زر إعادة التغريد",
    "IN_PROGRESS": "قيد التنفيذ",
    "COMPLETED": "مكتمل",
    "FAILED": "فشل",
    "STOPPED": "متوقف"
  }

  private actionsSub?: Subscription;
  private devicesSub?: Subscription;
  private connectedDevicesSub?: Subscription;
  private accountsSub?: Subscription;
  private tweetsSub?: Subscription;
  private categoriesSub?: Subscription;

  isDevicesLoaded = false;
  isConnectedDevicesLoaded = false;
  isAccountsLoaded = false;
  isTweetsLoaded = false;
  isCategoriesLoaded = false;

  // Mapping of FormGroups where key is "deviceId-accountId"
  rowForms: Map<string, FormGroup> = new Map();

  private pollingIntervals: Map<string, any> = new Map(); // Track polling for each action

  headerCheckboxChecked: boolean = false;
  headerCheckboxIndeterminate: boolean = false;

  deviceFilter: string = '';
  accountFilter: string = '';

  private filterTimeout: any = null;

  sortDirection: { [key: string]: 'asc' | 'desc' } = {};

  hideDisconnected: boolean = false;
  showOnlySelected: boolean = false;

  universalForm: FormGroup = new FormGroup({
    actionType: new FormControl(''),
    category: new FormControl(''),
    hashtag: new FormControl(''),
    targetTweetId: new FormControl(''),
    range: new FormControl(null),
  });

  selectedUniversalMedia: File[] = [];
  universalMedia: { file: File; previewUrl: string }[] = [];
  mediaStats = { images: 0, videos: 0 };
  selectedAccountCount = 0;

  public now = new Date();

  @Output() scheduledChanged = new EventEmitter<boolean>();

  constructor(
    public actionsService: ActionsService,
    public devicesService: DevicesService,
    public accountsService: AccountsService,
    public tweetsService: TweetsService,
    public categoriesService: CategoriesService,
    private snackbarService: SnackbarService,
    public dialog: MatDialog // Inject MatDialog
  ) { }


  toggleSchedule(isScheduled: boolean): void {
    this.scheduledChanged.emit(isScheduled);
  }

  validateForm(form: FormGroup): boolean {
    const isSelected = form.get('isSelected')?.value;
    if (!isSelected) return true;

    const action = form.get('actionType')?.value;

    if (!action) return false; // Action type is mandatory

    if (['reply', 'repost', 'like'].includes(action)) {
      if (!form.get('targetTweetId')?.value?.trim()) return false;
    }

    if (['tweet', 'reply'].includes(action)) {
      const hasTweet = !!form.get('tweet')?.value?.trim();
      const hasMedia = !!form.get('media')?.value;
      if (!hasTweet && !hasMedia) return false;
    }

    return true;
  }


  onDeviceFilterInput() { this.debounceFilter(); }
  onAccountFilterInput() { this.debounceFilter(); }

  debounceFilter(): void {
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  distributeDatetimeRange(range: [Date, Date] | null): void {
    if (!range || range.length !== 2 || !range[0] || !range[1] || range[1] <= range[0]) {
      return; // silently skip if invalid
    }

    const eligibleForms = this.getVisibleForms().filter(form =>
      form.get('isSelected')?.value
    );

    if (eligibleForms.length === 0) return;

    const [startTime, endTime] = [range[0].getTime(), range[1].getTime()];
    const total = eligibleForms.length;
    const interval = total === 1 ? 0 : (endTime - startTime) / (total - 1);

    eligibleForms.forEach((form, index) => {
      const assignedTime = new Date(startTime + interval * index);
      form.get('datetime')?.setValue(assignedTime);
    });
  }

  clearDatetimeRange(): void {
    this.universalForm.get('range')?.setValue(null);

    const now = new Date();
    const eligibleForms = this.getVisibleForms().filter(form =>
      form.get('isSelected')?.value
    );

    for (const form of eligibleForms) {
      form.get('datetime')?.setValue(now);
    }
  }



  getLocalizedArabicDatetime(date: Date | string | number): string {
    if (!date) return '';

    const now = new Date();
    const selected = new Date(date);

    const nowRounded = new Date(now);
    nowRounded.setSeconds(0, 0);

    const selectedRounded = new Date(selected);
    selectedRounded.setSeconds(0, 0);

    if (selectedRounded <= nowRounded) {
      return 'الآن';
    }

    const locale = 'ar';
    const format = "EEEE، d MMMM y، الساعة h:mm a";
    return formatDate(selected, format, locale);
  }

  clearDeviceFilter() { this.deviceFilter = ''; this.applyFilters(); }
  clearAccountFilter() { this.accountFilter = ''; this.applyFilters(); }

  applyFilters(): void {
    this.paginatedDevices = [];

    const deviceText = this.deviceFilter.trim().toLowerCase();
    const accountText = this.accountFilter.trim().toLowerCase();

    this.devices.forEach(device => {
      const deviceMatches = !deviceText || (
        (device.name && device.name.toLowerCase().includes(deviceText)) ||
        (device.serial && device.serial.toLowerCase().includes(deviceText))
      );

      const connectionMatches = !this.hideDisconnected || device.isConnected;

      const filteredAccounts: string[] = [];

      device.accounts.forEach(accountId => {
        const account = this.getAccountById(accountId);
        const form = this.rowForms.get(this.getFormKey(device.id, accountId));
        if (!account || !form) return;

        const accountMatches = !accountText || (
          (account.name && account.name.toLowerCase().includes(accountText)) ||
          (account.username && account.username.toLowerCase().includes(accountText))
        );

        const selectedMatches = !this.showOnlySelected || form.get('isSelected')?.value;

        if (deviceMatches && accountMatches && connectionMatches && selectedMatches) {
          filteredAccounts.push(accountId);
        }
      });

      // Only add the device if at least one of its accounts passed the filters
      if (filteredAccounts.length > 0) {
        this.paginatedDevices.push({ ...device, accounts: filteredAccounts });
      }
    });

    this.updateHeaderCheckboxState();
    this.syncUniversalActionType();
  }

  canShowOnlySelected(): boolean {
    const totalForms = this.rowForms.size;
    const selectedForms = Array.from(this.rowForms.values()).filter(form => form.get('isSelected')?.value).length;

    // if (selectedForms == 0) {
    //   return false;
    // }

    return selectedForms < totalForms;
  }

  onUniversalActionTypeChange(action: string): void {
    const universal = this.universalForm;

    if (action !== 'tweet') {
      universal.get('category')?.setValue('');
      universal.get('hashtag')?.setValue('');
      universal.get('tweet')?.setValue(''); // Reset tweet as well
    }

    if (!['reply', 'repost', 'like'].includes(action)) {
      universal.get('targetTweetId')?.setValue('');
    }

    this.paginatedDevices.forEach(device => {
      if (!this.hideDisconnected || device.isConnected) {
        device.accounts.forEach(accountId => {
          const form = this.rowForms.get(this.getFormKey(device.id, accountId));
          if (form && (!this.showOnlySelected || form.get('isSelected')?.value)) {
            form.get('actionType')?.setValue(action);
          }
        });
      }
    });
  }


  onUniversalCategoryChange(categoryId: string): void {
    this.paginatedDevices.forEach(device => {
      if (!this.hideDisconnected || device.isConnected) {
        device.accounts.forEach(accountId => {
          const form = this.rowForms.get(this.getFormKey(device.id, accountId));
          if (
            form &&
            (!this.showOnlySelected || form.get('isSelected')?.value) &&
            ['tweet', 'reply'].includes(form.get('actionType')?.value)
          ) {
            form.get('category')?.setValue(categoryId);
            form.get('tweet')?.setValue('');  // Reset tweet
            this.assignRandomTweet(device.id, accountId, categoryId);
          }
        });
      }
    });
  }

  onUniversalHashtagChange(): void {
    const tag = this.universalForm.get('hashtag')?.value || '';
    this.paginatedDevices.forEach(device => {
      if (!this.hideDisconnected || device.isConnected) {
        device.accounts.forEach(accountId => {
          const form = this.rowForms.get(this.getFormKey(device.id, accountId));
          if (
            form &&
            (!this.showOnlySelected || form.get('isSelected')?.value) &&
            ['tweet', 'reply'].includes(form.get('actionType')?.value)
          ) {
            form.get('hashtag')?.setValue(tag);
          }
        });
      }
    });
  }

  onUniversalTargetTweetIdChange(): void {
    const targetId = this.universalForm.get('targetTweetId')?.value || '';
    this.paginatedDevices.forEach(device => {
      if (!this.hideDisconnected || device.isConnected) {
        device.accounts.forEach(accountId => {
          const form = this.rowForms.get(this.getFormKey(device.id, accountId));
          if (
            form &&
            (!this.showOnlySelected || form.get('isSelected')?.value) &&
            ['reply', 'repost', 'like'].includes(form.get('actionType')?.value)
          ) {
            form.get('targetTweetId')?.setValue(targetId);
          }
        });
      }
    });
  }

  resetUniversalFields(): void {
    this.universalForm.reset();
  }

  onMediaSelected(event: Event, deviceId: string, accountId: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const form = this.getForm(deviceId, accountId);
    if (!form) return;

    const reader = new FileReader();
    reader.onload = () => {
      form.get('media')?.setValue({
        file,
        previewUrl: reader.result,
      });
    };

    reader.readAsDataURL(file);
  }

  getMediaType(media: any): 'image' | 'video' | null {
    if (!media || !media.file?.type) return null;
    return media.file.type.startsWith('video') ? 'video' : 'image';
  }

  getMediaPreview(media: any): string {
    return media?.previewUrl || '';
  }

  clearMedia(deviceId: string, accountId: string): void {
    const form = this.getForm(deviceId, accountId);
    if (form) {
      form.get('media')?.setValue(null);
    }
  }

  onUniversalMediaSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files || []);

    // Filter out files with the same name and type (extension)
    const newFiles = files.filter(newFile =>
      !this.universalMedia.some(existing =>
        existing.file.name === newFile.name && existing.file.type === newFile.type
      )
    );

    const readers = newFiles.map(file => {
      return new Promise<{ file: File, previewUrl: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ file, previewUrl: reader.result as string });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(result => {
      this.universalMedia = [...this.universalMedia, ...result]; // ⬅️ Append instead of replace
      this.updateMediaStats();
      this.distributeUniversalMedia();
    });

    // Reset file input value so that the same file can be selected again
    (event.target as HTMLInputElement).value = '';
  }

  getArabicLabel(count: number, singular: string, dual: string, plural: string, pluralAbove10: string): string {
    if (count === 0) return '';
    if (count === 1) return `1 ${singular}`;
    if (count === 2) return `2 ${dual}`;
    if (count >= 3 && count <= 10) return `${count} ${plural}`;
    return `${count} ${pluralAbove10}`;
  }

  getArabicMediaLabel(type: 'image' | 'video'): string {
    const count = this.getMediaCount(type);
    if (type === 'image') {
      return count > 0
        ? this.getArabicLabel(count, 'صورة', 'صورتان', 'صور', 'صورة')
        : 'لا صور';
    } else {
      return count > 0 ? `${count} فيديو` : '';
    }
  }

  getArabicAccountLabel(): string {
    const count = this.getSelectedAccountsCount();
    if (count === 0) return 'لا حسابات محددة';
    if (count === 1) return '1 حساب محدد';
    if (count === 2) return '2 حسابان محددان';
    if (count >= 3 && count <= 10) return `${count} حسابات محددة`;
    return `${count} حساب محدد`;
  }

  updateMediaStats(): void {
    let images = 0, videos = 0;

    for (const media of this.universalMedia) {
      const type = media.file.type;
      if (type.startsWith('image')) images++;
      else if (type.startsWith('video')) videos++;
    }

    this.mediaStats = { images, videos };
    this.updateSelectedAccountCount();
  }

  updateSelectedAccountCount(): void {
    const eligibleForms = this.getVisibleForms().filter(f =>
      f.get('isSelected')?.value &&
      ['tweet', 'reply'].includes(f.get('actionType')?.value)
    );
    this.selectedAccountCount = eligibleForms.length;
  }

  clearUniversalMedia(): void {
    this.universalMedia = [];
    const eligibleForms = this.getVisibleForms().filter(f =>
      f.get('isSelected')?.value &&
      ['tweet', 'reply'].includes(f.get('actionType')?.value)
    );
    for (const form of eligibleForms) {
      form.get('media')?.setValue(null);
    }

    this.updateMediaStats();
  }

  getMediaCount(type: 'image' | 'video'): number {
    return this.universalMedia.filter(media => media.file.type.startsWith(type)).length;
  }

  getSelectedAccountsCount(): number {
    let count = 0;
    this.rowForms.forEach(form => {
      if (form.get('isSelected')?.value &&
        ['tweet', 'reply'].includes(form.get('actionType')?.value)) {
        count++;
      }
    });
    return count;
  }

  distributeUniversalMedia(): void {
    const eligibleForms = this.getVisibleForms().filter(f =>
      f.get('isSelected')?.value &&
      ['tweet', 'reply'].includes(f.get('actionType')?.value)
    );

    if (eligibleForms.length === 0 || this.universalMedia.length === 0) return;

    const selectedForms = [...eligibleForms];
    const mediaPool = [...this.universalMedia];

    // If there are fewer media than accounts, assign available and leave rest empty
    if (mediaPool.length < selectedForms.length) {
      selectedForms.forEach((form, i) => {
        if (i < mediaPool.length) {
          form.get('media')?.setValue(mediaPool[i]);
        } else {
          form.get('media')?.setValue(null);
        }
      });
    } else {
      // Shuffle media and assign unique ones
      const shuffledMedia = mediaPool.sort(() => Math.random() - 0.5).slice(0, selectedForms.length);
      const shuffledForms = selectedForms.sort(() => Math.random() - 0.5);

      for (let i = 0; i < shuffledForms.length; i++) {
        shuffledForms[i].get('media')?.setValue(shuffledMedia[i]);
      }
    }
  }

  assignRandomTweet(deviceId: string, accountId: string, categoryId: string): void {
    const form = this.rowForms.get(this.getFormKey(deviceId, accountId));
    if (!form) return;

    const tweets = this.tweets.filter(t => t.categoryId === categoryId);
    if (tweets.length === 0) return;

    const random = tweets[Math.floor(Math.random() * tweets.length)];
    form.patchValue({ tweet: random.tweet, tweetId: random.id });
  }

  syncUniversalActionType(): void {
    const visibleForms = this.getVisibleForms();

    const actionTypes = new Set(
      visibleForms.map(form => form.get('actionType')?.value).filter(actionType => actionType)
    );

    if (actionTypes.size === 1) {
      this.universalForm.get('actionType')?.setValue(Array.from(actionTypes)[0]);
    } else {
      this.universalForm.get('actionType')?.setValue('');
    }
  }

  sortBy(field: string): void {
    const direction = this.sortDirection[field] === 'asc' ? 'desc' : 'asc';
    this.sortDirection[field] = direction;

    this.paginatedDevices.sort((a, b) => {
      let valueA = '';
      let valueB = '';

      if (field === 'device') {
        valueA = a.name || '';
        valueB = b.name || '';
      } else if (field === 'account') {
        valueA = a.accounts.length.toString();
        valueB = b.accounts.length.toString();
      }
      // You can add more fields here...

      if (direction === 'asc') {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
  }

  toggleDisconnectedVisibility(): void {
    this.hideDisconnected = !this.hideDisconnected;
    this.applyFilters();
  }

  toggleShowSelected(): void {
    this.showOnlySelected = !this.showOnlySelected;
    this.applyFilters();
  }

  onSubmit(): void {
    let allValid = true;

    this.rowForms.forEach((form) => {
      if (form.get('isSelected')?.value && !this.validateForm(form)) {
        allValid = false;
        form.markAllAsTouched();
      }
    });

    if (!allValid) {
      this.snackbarService.openSnackBar("بعض الحقول المطلوبة مفقودة أو غير صحيحة.", 'failure');
      return;
    }

    const actionsToSubmit: Action[] = [];
    const mediaUploadResults: Map<string, string> = new Map();
    const mediaUploadPromises: Promise<void>[] = [];

    this.rowForms.forEach((form, key) => {
      const isSelected = form.get('isSelected')?.value;
      if (!isSelected) return;

      const media = form.get('media')?.value;
      if (media?.file) {
        const formData = new FormData();
        formData.append('file', media.file);

        // Upload the media and patch mediaUrl after upload
        const uploadPromise = this.actionsService.uploadMedia(formData).toPromise().then(response => {
          if ((response?.status === 200 || response?.status === 201) && response.body) {
            mediaUploadResults.set(key, response.body.mediaUrl);
          }
        }).catch(err => {
          console.error(`[-] Failed to upload media for ${key}:`, err);
        });

        mediaUploadPromises.push(uploadPromise);
      }
    });

    Promise.all(mediaUploadPromises).then(() => {
      // All media URLs are now patched in the forms
      this.rowForms.forEach((form, key) => {
        const isSelected = form.get('isSelected')?.value;
        if (!isSelected) return;

        const formValue = form.value;
        if (!formValue.actionType) return;

        const tweetId = this.tweets.find(t => t.tweet === formValue.tweet)?.id || '';
        const categoryId = formValue.category;
        const mediaUrl = mediaUploadResults.get(key) || '';

        const action: Action = {
          id: uuidv4(),
          action: formValue.actionType,
          deviceId: key.split('-')[0],
          accountId: key.split('-')[1],
          timestamp: formValue.datetime.getTime(),
          isFinished: false,
          status: 'STARTED',
          taskId: '',
          tweetId: tweetId,
          categoryId: categoryId,
          targetTweetId: formValue.targetTweetId || '',
          mediaUrl: mediaUrl,
          hashtag: formValue.hashtag || ''
        };

        actionsToSubmit.push(action);
      });

      if (actionsToSubmit.length === 0) {
        console.warn('[~] لم يتم تحديد أي حسابات.');
        return;
      }

      this.actionsService.createActions(actionsToSubmit).subscribe(
        response => {
          console.log('Actions submitted successfully:', response.body);
          this.actionsService.getActions();
          this.updateActions();
          this.toggleSchedule(false);
        },
        error => {
          console.error('Error submitting actions:', error);
        }
      );

      console.log('[+] جاهز للتنفيذ، التفاصيل:');
      console.table(actionsToSubmit);

    }).catch(err => {
      console.error('[-] Media upload failed:', err);
      this.snackbarService.openSnackBar("فشل تحميل الوسائط.", 'failure');
    });
  }

  onCancel(): void {
    this.toggleSchedule(false);
  }

  updateDisabled(action: Action, form: FormGroup): void {
    // Apply disable/enable logic dynamically
    if (action.isFinished === false && action.status !== '-') {
      form.get('category')?.disable();
      form.get('actionType')?.disable();
      form.get('tweet')?.disable();
      form.get('targetTweetId')?.disable();
      form.get('hashtag')?.disable();
    } else {
      form.get('category')?.enable();
      form.get('actionType')?.enable();
      form.get('tweet')?.enable();
      form.get('targetTweetId')?.enable();
      form.get('hashtag')?.enable();
    }
  }

  refreshTweet(deviceId: string, accountId: string): void {
    const formKey = this.getFormKey(deviceId, accountId);
    const form = this.rowForms.get(formKey);
    if (!form) return;

    const selectedCategory = form.get('category')?.value;
    if (!selectedCategory) return;

    let availableTweets = this.tweets.filter(tweet => tweet.categoryId === selectedCategory);
    if (availableTweets.length === 0) return;

    const usedTweets = new Set(
      Array.from(this.rowForms.values()).map(f => f.get('tweet')?.value)
    );

    let filteredTweets = availableTweets.filter(tweet => !usedTweets.has(tweet.tweet));
    if (filteredTweets.length === 0) filteredTweets = availableTweets;

    const randomTweet = filteredTweets[Math.floor(Math.random() * filteredTweets.length)];
    form.patchValue({ tweet: randomTweet.tweet, tweetId: randomTweet.id });
  }


  handleTweetInput(deviceId: string, accountId: string): void {
    const formKey = this.getFormKey(deviceId, accountId);
    const form = this.rowForms.get(formKey);

    if (!form) return;

    const tweetText = form.get('tweet')?.value;
    if (!tweetText || tweetText.trim() === '') {
      return;
    }

    const selectedCategory = form.get('category')?.value;
    if (!selectedCategory) return;

    // Check if the tweet already exists
    let existingTweet = this.tweets.find(t => t.tweet === tweetText && t.categoryId === selectedCategory);

    if (existingTweet) {
      form.patchValue({ tweetId: existingTweet.id });
      return;
    }

    // If not found, create a new tweet
    const newTweet: Tweet = {
      id: '',
      tweet: tweetText,
      categoryId: selectedCategory,
      isConsumed: false
    };

    this.tweetsService.createTweet(newTweet).subscribe(response => {
      if (response.status === 200 || response.status === 201) {
        newTweet.id = response.body.id;
        this.tweets.push(newTweet);
        form.patchValue({ tweetId: newTweet.id });
      }
    });
  }

  onCategoryChange(categoryId: string | null, deviceId: string, accountId: string): void {
    const formKey = this.getFormKey(deviceId, accountId);
    const form = this.rowForms.get(formKey);

    if (form) {
      form.patchValue({
        category: categoryId,
        tweet: ''  // Reset tweet
      });
    }

    // If a category is selected, get a new tweet
    if (categoryId) {
      this.refreshTweet(deviceId, accountId);
    }
  }

  getStatus(deviceId: string, accountId: string): string {
    const formKey = this.getFormKey(deviceId, accountId);
    const form = this.rowForms.get(formKey);

    if (form) {
      const status = form.get('status')?.value || 'pending';
      return this.TASK_STATUS_TRANSLATIONS[status] || "-"; // Translate to Arabic
    }

    return "-"; // Default if form is not found
  }

  getStatusClass(device: Device): string {
    return device.isConnected ? 'blinking-green' : 'solid-red';
  }

  getAccountById(accountId: string): Account | undefined {
    return this.accounts.find(account => account.id === accountId);
  }

  toggleAccountView(account: Account, showFullName: boolean): void {
    account.showFullName = showFullName;
  }

  isConnected(device: Device): boolean {
    return this.connectedDevices.some((connectedDevice: Device) => connectedDevice.serial == device.serial);
  }

  hasTweets(categoryId: string): boolean {
    return this.tweets.some(t => t.categoryId === categoryId);
  }

  getForm(deviceId: string, accountId: string, isConnected: boolean = false): FormGroup {
    const formKey = this.getFormKey(deviceId, accountId);

    if (!this.rowForms.has(formKey)) {
      this.rowForms.set(formKey, new FormGroup({
        actionType: new FormControl({ value: '', disabled: !isConnected }, Validators.required),
        category: new FormControl({ value: '', disabled: !isConnected }),
        hashtag: new FormControl({ value: '', disabled: !isConnected }),
        tweet: new FormControl({ value: '', disabled: !isConnected }),
        targetTweetId: new FormControl({ value: '', disabled: !isConnected }),
        media: new FormControl({ value: null, disabled: !isConnected }),
        datetime: new FormControl({ value: new Date(), disabled: !isConnected }),
        status: new FormControl('-'),
        isDisabled: new FormControl(false),
        isSelected: new FormControl(isConnected),
      }));
    }

    return this.rowForms.get(formKey)!;
  }


  getFormKey(deviceId: string, accountId: string): string {
    return `${deviceId}-${accountId}`;
  }

  updateDevices() {
    if (!this.isConnectedDevicesLoaded || !this.isDevicesLoaded || !this.isAccountsLoaded) {
      return;
    }

    // update status of each device
    this.devices.forEach((device: Device) => {
      device.isConnected = this.isConnected(device);
    });

    this.resetData();

    this.rowForms.clear(); // Reset the forms map

    this.devices.forEach(device => {
      device.accounts.forEach(accountId => {
        const isConnected = device.isConnected;

        const formKey = this.getFormKey(device.id, accountId);
        this.rowForms.set(formKey, new FormGroup({
          actionType: new FormControl({ value: '', disabled: !isConnected }, Validators.required),
          category: new FormControl({ value: '', disabled: !isConnected }),
          hashtag: new FormControl({ value: '', disabled: !isConnected }),
          tweet: new FormControl({ value: '', disabled: !isConnected }),
          targetTweetId: new FormControl({ value: '', disabled: !isConnected }),
          media: new FormControl({ value: null, disabled: !isConnected }),
          datetime: new FormControl({ value: new Date(), disabled: !isConnected }),
          status: new FormControl('-'),
          isDisabled: new FormControl(false),
          isSelected: new FormControl(isConnected),
        }));
      });
    });
    this.updateHeaderCheckboxState();

    // print device serials to console seperated by space
    console.log(this.devices);
    console.log("connected devices: " + this.devices.map((device: Device) => device.serial).join(' '));

    // sort devices by connection status
    this.devices.sort((a: Device, b: Device) => {
      return (a.isConnected && !b.isConnected) ? -1 : 1;
    });
  }

  onCheckboxChange(deviceId: string, accountId: string): void {
    const form = this.rowForms.get(this.getFormKey(deviceId, accountId));
    if (!form) return;

    const isSelected = form.get('isSelected')?.value;
    const controls = ['actionType', 'category', 'hashtag', 'tweet', 'targetTweetId'];

    controls.forEach(control => {
      if (isSelected) {
        form.get(control)?.enable();
      } else {
        form.get(control)?.disable();
      }
    });

    this.updateHeaderCheckboxState();
  }

  toggleSelectAll(event: MatCheckboxChange): void {
    const isChecked = event.checked;

    this.paginatedDevices.forEach(device => {
      // Check if this device should be visible based on filters/toggles
      const deviceVisible = (!this.hideDisconnected || device.isConnected);

      if (!deviceVisible) return;

      device.accounts.forEach(accountId => {
        const formKey = this.getFormKey(device.id, accountId);
        const form = this.rowForms.get(formKey);

        if (form) {
          const rowVisible = (!this.showOnlySelected || form.get('isSelected')?.value);

          if (rowVisible) {
            form.get('isSelected')?.setValue(isChecked);

            const controls = ['actionType', 'category', 'hashtag', 'tweet', 'targetTweetId'];
            controls.forEach(control => {
              if (isChecked) {
                form.get(control)?.enable();
              } else {
                form.get(control)?.disable();
              }
            });
          }
        }
      });
    });

    this.updateHeaderCheckboxState();
  }

  updateHeaderCheckboxState(): void {
    const visibleForms = this.getVisibleForms();

    const allChecked = visibleForms.length > 0 && visibleForms.every(form => form.get('isSelected')?.value);
    const noneChecked = visibleForms.every(form => !form.get('isSelected')?.value);

    this.headerCheckboxChecked = allChecked;
    this.headerCheckboxIndeterminate = !allChecked && !noneChecked;
  }

  getVisibleForms(): FormGroup[] {
    const visible: FormGroup[] = [];

    this.paginatedDevices.forEach(device => {
      device.accounts.forEach(accountId => {
        const formKey = this.getFormKey(device.id, accountId);
        const form = this.rowForms.get(formKey);

        const connectedVisible = !this.hideDisconnected || device.isConnected;
        const selectedVisible = !this.showOnlySelected || form?.get('isSelected')?.value;

        if (form && connectedVisible && selectedVisible) {
          visible.push(form);
        }
      });
    });

    return visible;
  }

  resetData(): void {

  }

  updateActions() {
    if (this.actions.length === 0) {
      return;
    }

    // Filter actions to get the most recent ones based on timestamp
    const latestActions = new Map<string, Action>();

    this.actions.forEach((action: Action) => {
      const formKey = this.getFormKey(action.deviceId, action.accountId);
      const existingAction = latestActions.get(formKey);

      // Keep only the most recent action per (deviceId, accountId)
      if (!existingAction || action.timestamp > existingAction.timestamp) {
        latestActions.set(formKey, action);
      }
    });

    // Update forms with the latest action data
    latestActions.forEach((action, formKey) => {
      const form = this.rowForms.get(formKey);
      if (form) {
        form.patchValue({
          status: action.status.toUpperCase(),
          actionType: action.action || '',
          category: action.categoryId || '',
          tweet: action.tweetId ? this.tweets.find(t => t.id === action.tweetId) || '' : '',
          targetTweetId: action.targetTweetId || '',
          hashtag: action.hashtag || '',
          isDisabled: action.isFinished === false && action.status !== '-'
        });

        this.updateDisabled(action, form);
      }
    });

    // console.log("Updated Actions:", Array.from(latestActions.values()));
  }

  startPollingUnfinishedActions(): void {
    // Clear any existing polling intervals
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();

    // Get the most recent unfinished action per (deviceId, accountId)
    const latestUnfinishedActions = new Map<string, Action>();

    this.actions
      .filter(action => !action.isFinished) // Only unfinished actions
      .forEach(action => {
        const key = this.getFormKey(action.deviceId, action.accountId);
        const existingAction = latestUnfinishedActions.get(key);

        // Keep only the most recent action (based on timestamp)
        if (!existingAction || action.timestamp > existingAction.timestamp) {
          latestUnfinishedActions.set(key, action);
        }
      });

    // Start polling for the most recent unfinished actions
    latestUnfinishedActions.forEach((action, key) => {
      if (!this.pollingIntervals.has(action.id)) {
        const interval = setInterval(() => {
          this.actionsService.getAction(action).subscribe(response => {
            if (response.status === 200 || response.status === 201) {
              const updatedAction = response.body;
              this.updateSingleAction(updatedAction);

              // Stop polling if action is finished
              if (updatedAction.isFinished) {
                clearInterval(this.pollingIntervals.get(action.id));
                this.pollingIntervals.delete(action.id);
                console.log(`Polling stopped for action ${action.id}`);
              }
            }
          }, error => {
            console.error(`Error fetching action ${action.id}:`, error);
          });
        }, 1000); // Poll every second

        this.pollingIntervals.set(action.id, interval);
      }
    });

    if (this.pollingIntervals.size === 0) {
      console.log("No unfinished actions, polling is not needed.");
    }
  }

  updateSingleAction(updatedAction: Action): void {
    const formKey = this.getFormKey(updatedAction.deviceId, updatedAction.accountId);
    const form = this.rowForms.get(formKey);

    if (form) {
      form.patchValue({
        status: updatedAction.status.toUpperCase(),
        actionType: updatedAction.action || '',
        category: updatedAction.categoryId || '',
        tweet: updatedAction.tweetId ? this.tweets.find(t => t.id === updatedAction.tweetId) || '' : '',
        targetTweetId: updatedAction.targetTweetId || '',
        hashtag: updatedAction.hashtag || '',
        isDisabled: updatedAction.isFinished === false && updatedAction.status !== '-'
      });

      this.updateDisabled(updatedAction, form);
    }
  }

  ngOnInit(): void {
    this.now = new Date();
    this.universalForm.get('range')?.valueChanges.subscribe(range => {
      this.distributeDatetimeRange(range);
    });

    this.devicesService.getConnectedDevices();
    this.connectedDevicesSub = this.devicesService.getConnectedDevicesUpdateListener().subscribe((devicesData: any) => {
      this.connectedDevices = devicesData;
      this.isConnectedDevicesLoaded = true;
      this.updateDevices();
    });

    this.devicesService.getDevices();
    this.devicesSub = this.devicesService.getDevicesUpdateListener().subscribe((devicesData: any) => {
      this.devices = devicesData;
      this.paginatedDevices = devicesData;
      this.isDevicesLoaded = true;
      this.updateDevices();
    });

    this.accountsService.getAccounts();
    this.accountsSub = this.accountsService.getAccountsUpdateListener().subscribe((accountsData: any) => {
      this.accounts = accountsData;
      this.isAccountsLoaded = true;
      this.updateDevices();
    });

    this.tweetsService.getTweets();
    this.tweetsSub = this.tweetsService.getTweetsUpdateListener().subscribe((tweetsData: any) => {
      this.tweets = tweetsData;
      this.isTweetsLoaded = true;
    });

    this.categoriesService.getCategories();
    this.categoriesSub = this.categoriesService.getCategoriesUpdateListener().subscribe((categoriesData: any) => {
      this.categories = categoriesData;
      this.isCategoriesLoaded = true;
    });

    this.actionsService.getActions();
    this.actionsSub = this.actionsService.getActionsUpdateListener().subscribe((actionsData: Action[]) => {
      this.actions = actionsData;
      this.updateActions();
      this.startPollingUnfinishedActions();
    });
  }

  ngOnDestroy(): void {
    this.devicesSub?.unsubscribe();
    this.connectedDevicesSub?.unsubscribe();
    this.accountsSub?.unsubscribe();
    this.tweetsSub?.unsubscribe();
    this.categoriesSub?.unsubscribe();
    this.actionsSub?.unsubscribe();
  }

}
