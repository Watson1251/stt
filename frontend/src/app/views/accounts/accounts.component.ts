import { Subscription } from 'rxjs';
import { NgFor, CommonModule, } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, } from '@angular/core';
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
import { AccountsService } from '../../services/accounts.services';
import { ConfirmComponent } from '../confirm/confirm.component';
import { MatDialog } from '@angular/material/dialog';
import { DevicesService } from '../../services/devices.services';
import { Device } from '../../models/device.model';

@Component({
  selector: 'app-accounts',
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
  ],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss'
})
export class AccountsComponent implements OnInit, OnDestroy {

  Helper = Helper;

  devices: Device[] = [];

  accounts: Account[] = [];
  paginatedAccounts: Account[] = [];
  selectedAccount: Account | null = null;

  formValidator: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    username: new FormControl('', [Validators.required]),
  });

  isSubmit = true;
  isDelete = true;

  titleLabel = 'اختر حسابًا من القائمة!';
  submitButton = 'إضافة';
  deleteButton = 'حذف';

  nameLabel = 'اسم الحساب';
  usernameLabel = 'معرّف الحساب';

  nameError = 'الرجاء ادخال اسم الحساب';
  usernameError = 'الرجاء ادخال معرّف الحساب';

  private accountsSub?: Subscription;
  private devicesSub?: Subscription;

  constructor(
    public devicesService: DevicesService,
    public accountsService: AccountsService,
    private snackbarService: SnackbarService,
    public dialog: MatDialog // Inject MatDialog
  ) { }


  addAccount() {

    if (this.isInvalid('all') || this.formValidator.value == null) {
      return;
    }

    const account: Account = {
      id: '',
      name: this.formValidator.get("name")?.value,
      username: this.formValidator.get("username")?.value,
      showFullName: false
    }

    this.accountsService.createAccount(account).subscribe(response => {
      if (response.status == 200 || response.status == 201) {
        this.accountsService.getAccounts();
        this.snackbarService.openSnackBar('تم إضافة الحساب بنجاح.', 'success');

        // reset
        this.selectedAccount = null;
        this.formValidator.reset();
        this.titleLabel = 'اختر حسابًا من القائمة!';
      }
    });

  }

  async editAccount() {

    if (this.isInvalid('all') || this.formValidator.value == null || !this.isFormChanged()) {
      return;
    }

    const confirmed = await this.openConfirmationDialog(
      'تأكيد التعديل',
      'هل أنت متأكد أنك تريد حفظ التغييرات على هذا الحساب؟',
      'info'
    );

    if (!confirmed) {
      return;
    }

    const account: Account = {
      id: this.selectedAccount?.id || '',
      name: this.formValidator.get("name")?.value,
      username: this.formValidator.get("username")?.value,
      showFullName: false
    }

    this.accountsService.updateAccount(account).subscribe(response => {
      if (response.status == 200 || response.status == 201) {
        this.accountsService.getAccounts();
        this.snackbarService.openSnackBar('تم تحديث بيانات الحساب بنجاح.', 'success');

        // reset
        this.selectedAccount = null;
        this.formValidator.reset();
        this.titleLabel = 'اختر حسابًا من القائمة!';
      }
    });
  }

  async deleteAccount() {

    const confirmed = await this.openConfirmationDialog(
      'تأكيد الحذف',
      'هل أنت متأكد أنك تريد حذف هذا الحساب؟',
      'danger'
    );

    if (!confirmed) {
      return;
    }

    if (!this.selectedAccount) {
      return;
    }

    this.accountsService.deleteAccount(this.selectedAccount).subscribe(response => {
      if (response.status == 200 || response.status == 201) {

        // make a clone of selectedAccount
        const account = { ...this.selectedAccount };

        // loop through devices and update their account id
        this.devices.forEach(device => {
          // check if account.id is within device.accounts
          if (account && account.id && device.accounts.includes(account.id)) {
            // remove account.id from device.accounts
            device.accounts = device.accounts.filter(accountId => accountId !== account?.id);
            // update device
            this.devicesService.updateDevice(device).subscribe(response => {
            });
          }
        });


        this.accountsService.getAccounts();
        this.snackbarService.openSnackBar('تم حذف الحساب بنجاح.', 'success');

        // reset
        this.selectedAccount = null;
        this.formValidator.reset();
        this.titleLabel = 'اختر حسابًا من القائمة!';
      }
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

  onAdd() {
    this.titleLabel = "إضافة حساب جديد";
    this.submitButton = 'إضافة';

    const account: Account = {
      id: '',
      name: '-',
      username: '-',
      showFullName: false
    }

    this.selectedAccount = account;

    this.formValidator.patchValue({
      name: '',
      username: '',
    });
  }


  onSubmit() {
    if (!this.isSubmit) {
      return;
    }

    if (this.submitButton == 'إضافة') {
      this.addAccount();
    } else {
      this.editAccount();
    }
  }

  onDelete() {
    if (!this.isDelete) {
      return;
    }

    this.deleteAccount();
  }


  isFormChanged(): boolean {
    if (!this.selectedAccount) return false;

    const formValue: Account = {
      id: '',
      name: this.formValidator.get("name")?.value,
      username: this.formValidator.get("username")?.value,
      showFullName: false
    };

    // Compare primitive fields
    if (
      formValue.name !== this.selectedAccount.name ||
      formValue.username !== this.selectedAccount.username
    ) {
      return true;
    }

    return false;
  }

  isSubmitDisabled() {
    return !this.isFormChanged() || this.isInvalid('all');
  }

  isInvalid(formName: string) {
    this.formValidator.updateValueAndValidity();

    if (!this.isFormChanged()) {
      return false;
    }

    if (formName == 'all') {

      if (this.formValidator.invalid || this.formValidator.value == null) {
        return true;
      }

    } else {

      if (this.formValidator.get(formName)?.invalid || this.formValidator.get(formName)?.value == null) {
        return true;
      }

    }

    return false;
  }


  // Set initial values when selecting a account
  updateSelectedAccount(account: Account | null): void {
    this.selectedAccount = account;

    if (!account) {
      this.submitButton = 'إضافة';
      this.titleLabel = 'اختر حسابًا من القائمة!';
      this.formValidator.reset();
      return;
    }

    this.formValidator.patchValue({
      name: !account.name ? '' : account.name,
      username: !account.username ? '' : account.username,
    });

    this.formValidator.markAsPristine();  // Mark form as unchanged
    this.formValidator.markAsUntouched(); // Mark form as untouched

    this.submitButton = 'تحديث';
    this.titleLabel = 'تعديل بيانات الحساب';
  }

  // Select device when clicking on row
  onRowClick(account: Account, event?: Event): void {
    if (event) {
      event.stopPropagation(); // Prevents the row click event when clicking the checkbox
    }
    const result = this.selectedAccount === account ? null : account;
    this.updateSelectedAccount(result);
  }

  // Separate method for checkbox selection
  onCheckboxChange(event: MatCheckboxChange, account: Account): void {
    event.source.checked = event.checked; // Ensure checkbox reflects its state
    const result = event.checked ? account : null;
    this.updateSelectedAccount(result);
  }

  ngOnInit(): void {

    this.devicesService.getDevices();
    this.devicesSub = this.devicesService.getDevicesUpdateListener().subscribe((devicesData: any) => {
      this.devices = devicesData;
    });

    this.accountsService.getAccounts();
    this.accountsSub = this.accountsService.getAccountsUpdateListener().subscribe((accountsData: any) => {
      this.accounts = accountsData;

      if (this.accounts.length == 0) {
        this.titleLabel = 'لا يوجد حسابات مسجلة';
      }
    });
  }

  ngOnDestroy(): void {
    this.devicesSub?.unsubscribe();
    this.accountsSub?.unsubscribe();
  }

}
