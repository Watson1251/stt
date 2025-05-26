import { Subscription } from 'rxjs';
import { NgFor, CommonModule, } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, } from '@angular/core';
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

import {
  AccordionButtonDirective,
  AccordionComponent,
  AccordionItemComponent,
  TemplateIdDirective
} from '@coreui/angular';

import { Tabs2Module } from '@coreui/angular';

import { FormsModule, Validators } from '@angular/forms';

import { DOCUMENT, NgStyle } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChartOptions } from 'chart.js';
import {
} from '@coreui/angular';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { IconDirective } from '@coreui/icons-angular';

import { WidgetsBrandComponent } from '../widgets/widgets-brand/widgets-brand.component';
import { ScheduleComponent } from './schedule/schedule.component'; // Adjust the path as needed
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
import { AccountsService } from '../../services/accounts.services';
import { ConfirmComponent } from '../confirm/confirm.component';
import { MatDialog } from '@angular/material/dialog';
import { DevicesService } from '../../services/devices.services';
import { TweetsService } from '../../services/tweets.services';
import { CategoriesService } from '../../services/categories.services';
import { Device } from '../../models/device.model';
import { Tweet } from '../../models/tweet.model';
import { Category } from '../../models/category.model';
import { Action } from '../../models/action.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { ActionsService } from '../../services/actions.services';

@Component({
  selector: 'app-home',
  imports: [
    Tabs2Module,
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
    ScheduleComponent,

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

    AccordionComponent,
    AccordionItemComponent,
    TemplateIdDirective,
    AccordionButtonDirective
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {

  Helper = Helper;

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

  isScheduled = false;

  hoverStates: { [key: string]: boolean } = {};
  lastActionsMap: Map<string, Action> = new Map();

  intervalId: any;
  activeTabIndexMap: { [deviceId: string]: number } = {};
  selectedActionIdMap: { [accountId: string]: string } = {};
  selectedAction: Action | null = null;

  screenshotUrl: string = '';

  constructor(
    public actionsService: ActionsService,
    public devicesService: DevicesService,
    public accountsService: AccountsService,
    public tweetsService: TweetsService,
    public categoriesService: CategoriesService,
    private snackbarService: SnackbarService,
    public dialog: MatDialog // Inject MatDialog
  ) { }

  formatTweet(tweetId: string): string {
    if (tweetId == "") {
      return '-';
    }

    const tweet = this.tweets.find(tweet => tweet.id === tweetId);
    if (!tweet) {
      return '-';
    }

    return tweet.tweet;
  }

  formatAction(type: string) {
    switch (type) {
      case 'tweet':
        return 'إرسال تغريدة';
      case 'reply':
        return 'الرد على تغريدة';
      case 'repost':
        return 'إعادة تغريد';
      case 'like':
        return 'الإعجاب بتغريدة';
      default:
        return type;
    }
  }

  onActionSelect(accountId: string, actionId: string): void {
    this.selectedActionIdMap[accountId] = actionId;

    const action = this.actions.find(a => a.id === actionId);
    if (action) {
      this.selectedAction = action;
      this.updateScreenshotUrl(action);
    }
  }

  updateScreenshotUrl(action: Action): void {
    this.actionsService.getScreenshotUrl(action.taskId, action.status)
      .then(url => {
        this.screenshotUrl = url;
      })
      .catch(error => {
        console.error('Screenshot error:', error); // <- logs in browser
      });
  }

  getActionsByAccount(accountId: string): Action[] {
    return this.actions
      .filter(a => a.accountId === accountId)
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp)); // Descending
  }

  getAccountById(id: string) {
    return this.accounts.find(account => account.id === id);
  }

  formatTimestamp(actionId: string): string {
    if (actionId == "") {
      return '-';
    }

    const action = this.actions.find(action => action.id === actionId);
    if (!action) {
      return '-';
    }

    return this.formatTime(action.timestamp);
  }

  formatTime(timestamp: Number): string {

    const date = new Date(Number(timestamp));
    return date.toLocaleString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });

  }

  formatStatus(status: string): string {
    if (status == "") {
      return '-';
    }

    const action = this.actions.find(action => action.status === status);
    if (!action) {
      return '-';
    }

    if (action.status == "'pending'") {
      return "تمت الجدولة";
    }

    return this.TASK_STATUS_TRANSLATIONS[action.status];
  }

  getStatus(actionId: string): string {
    if (actionId == "") {
      return '-';
    }

    const action = this.actions.find(action => action.id === actionId);
    if (!action) {
      return '-';
    }

    return this.formatStatus(action.status);
  }

  getLastAction(accountId: string): string {
    if (!this.lastActionsMap.has(accountId)) {
      return '';
    }

    const action = this.lastActionsMap.get(accountId);
    if (!action) {
      return '';
    }

    return action.id;
  }

  getUsername(accountId: string): string {
    const account = this.accounts.find(acc => acc.id === accountId);
    if (account) {
      return '@' + account.username;
    }
    return '';
  }

  getName(accountId: string): string {
    const account = this.accounts.find(acc => acc.id === accountId);
    if (account) {
      return account.name;
    }
    return '';
  }

  getHoverKey(deviceId: string, index: number): string {
    return `${deviceId}-${index}`;
  }

  isHovered(deviceId: string, index: number): boolean {
    return this.hoverStates[this.getHoverKey(deviceId, index)] || false;
  }

  setHoverState(deviceId: string, index: number, state: boolean): void {
    this.hoverStates[this.getHoverKey(deviceId, index)] = state;
  }

  getStatusClass(device: Device): string {
    return device.isConnected ? 'blinking-green' : 'solid-red';
  }

  isConnected(device: Device): boolean {
    return this.connectedDevices.some((connectedDevice: Device) => connectedDevice.serial == device.serial);
  }

  updateDevices() {
    if (!this.isConnectedDevicesLoaded || !this.isDevicesLoaded || !this.isAccountsLoaded) {
      return;
    }

    // update status of each device
    this.devices.forEach((device: Device) => {
      device.isConnected = this.isConnected(device);
    });

    // sort devices by connection status
    this.devices.sort((a: Device, b: Device) => {
      return (a.isConnected && !b.isConnected) ? -1 : 1;
    });

  }

  updateActions() {
    this.actions.forEach(action => {
      if (!action.isFinished) {
        this.actionsService.getAction(action).subscribe((response) => {
          const tempAction = response.body;
          if (tempAction.action != "") {
            // update status, timestamp, and isFinished
            action.status = tempAction.status;
            action.timestamp = tempAction.timestamp;
            action.isFinished = tempAction.isFinished;

            if (this.selectedAction) {
              this.updateScreenshotUrl(this.selectedAction);
            }
          }
        });
      }
    });
  }

  ngOnInit(): void {
    this.devicesService.getConnectedDevices();
    this.connectedDevicesSub = this.devicesService.getConnectedDevicesUpdateListener().subscribe((devicesData: any) => {
      this.connectedDevices = devicesData;
      this.isConnectedDevicesLoaded = true;
      this.updateDevices();
    });

    this.devicesService.getDevices();
    this.devicesSub = this.devicesService.getDevicesUpdateListener().subscribe((devicesData: any) => {
      this.devices = devicesData;
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

      // Rebuild the lastActionsMap
      this.lastActionsMap.clear();
      for (const action of actionsData) {
        const accountId = action.accountId;
        this.lastActionsMap.set(accountId, action);
      }

      this.intervalId = setInterval(() => {
        this.updateActions();
      }, 3000);
    });
  }

  ngOnDestroy(): void {
    this.devicesSub?.unsubscribe();
    this.connectedDevicesSub?.unsubscribe();
    this.accountsSub?.unsubscribe();
    this.tweetsSub?.unsubscribe();
    this.categoriesSub?.unsubscribe();
    this.actionsSub?.unsubscribe();

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

}
