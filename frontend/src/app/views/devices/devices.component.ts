import { DevicesService } from '../../services/devices.services';
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
import { Device } from '../../models/device.model';
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
import { AccountsService } from '../../services/accounts.services';

@Component({
  selector: 'app-devices',
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
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.scss'
})
export class DevicesComponent implements OnInit, OnDestroy {

  Helper = Helper;

  devices: Device[] = [];
  paginatedDevices: Device[] = [];

  connectedDevicesOriginal: Device[] = [];
  connectedDevices: Device[] = [];
  paginatedConnectedDevices: Device[] = [];

  accounts: Account[] = [];

  selectedDevice: Device | null = null;

  formValidator: FormGroup = new FormGroup({
    serial: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    phone: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]),
    pin: new FormControl('', [Validators.required]),
    accounts: new FormControl([], [Validators.required]),
  });

  isSubmit = true;
  isDelete = true;

  submitButton = 'إضافة';
  deleteButton = 'حذف';
  titleLabel = 'اختر جهازًا من القائمة!';

  serialLabel = 'معرّف الهاتف';
  nameLabel = 'اسم الهاتف';
  phoneLabel = 'رقم الهاتف';
  pinLabel = 'رمز فتح القفل';
  accountsLabel = 'الحسابات المرتبطة بالهاتف';

  serialError = 'الرجاء ادخال معرّف الهاتف';
  nameError = 'الرجاء ادخال اسم الهاتف';
  phoneError = 'الرجاء ادخال رقم الهاتف';
  pinError = 'الرجاء ادخال الرقم السري';
  accountsError = 'الرجاء اختيار الحسابات المرتبطة بالهاتف';

  pinHoverState: { [deviceId: string]: boolean } = {};

  private devicesSub?: Subscription;
  private connectedDevicesSub?: Subscription;
  private accountsSub?: Subscription;

  private connectedDevicesLoaded = false;
  private devicesLoaded = false;

  constructor(
    public devicesService: DevicesService,
    public accountsService: AccountsService,
    private snackbarService: SnackbarService,
    public dialog: MatDialog // Inject MatDialog
  ) { }

  addDevice() {

    if (this.isInvalid('all') || this.formValidator.value == null) {
      return;
    }

    const device: Device = {
      id: '',
      serial: this.formValidator.get("serial")?.value,
      name: this.formValidator.get("name")?.value,
      phone: this.formValidator.get("phone")?.value,
      pin: this.formValidator.get("pin")?.value,
      accounts: this.formValidator.get("accounts")?.value
    }

    // replace accounts with their ids
    device.accounts = (device.accounts as unknown as Account[]).map((account: Account) => account.id);

    this.devicesService.createDevice(device).subscribe(response => {
      if (response.status == 200 || response.status == 201) {
        this.devicesService.getConnectedDevices();
        this.devicesService.getDevices();
        this.snackbarService.openSnackBar('تم إضافة الجهاز بنجاح.', 'success');

        // reset
        this.selectedDevice = null;
        this.formValidator.reset();
        this.titleLabel = 'اختر جهازًا من القائمة!';
      }
    });

  }

  async editDevice() {

    if (this.isInvalid('all') || this.formValidator.value == null || !this.isFormChanged()) {
      return;
    }

    const confirmed = await this.openConfirmationDialog(
      'تأكيد التعديل',
      'هل أنت متأكد أنك تريد حفظ التغييرات على هذا الجهاز؟',
      'info'
    );

    if (!confirmed) {
      return;
    }

    const device: Device = {
      id: this.selectedDevice?.id || '',
      serial: this.formValidator.get("serial")?.value,
      name: this.formValidator.get("name")?.value,
      phone: this.formValidator.get("phone")?.value,
      pin: this.formValidator.get("pin")?.value,
      accounts: this.formValidator.get("accounts")?.value
    }

    // replace accounts with their ids
    device.accounts = (device.accounts as unknown as Account[]).map((account: Account) => account.id);

    this.devicesService.updateDevice(device).subscribe(response => {
      if (response.status == 200 || response.status == 201) {
        this.devicesService.getConnectedDevices();
        this.devicesService.getDevices();
        this.snackbarService.openSnackBar('تم تحديث بيانات الجهاز بنجاح.', 'success');

        // reset
        this.selectedDevice = null;
        this.formValidator.reset();
        this.titleLabel = 'اختر جهازًا من القائمة!';
      }
    });
  }

  async deleteDevice() {

    const confirmed = await this.openConfirmationDialog(
      'تأكيد الحذف',
      'هل أنت متأكد أنك تريد حذف هذا الجهاز؟',
      'danger'
    );

    if (!confirmed) {
      return;
    }

    if (!this.selectedDevice) {
      return;
    }

    this.devicesService.deleteDevice(this.selectedDevice).subscribe(response => {
      if (response.status == 200 || response.status == 201) {
        this.devicesService.getConnectedDevices();
        this.devicesService.getDevices();
        this.snackbarService.openSnackBar('تم حذف الجهاز بنجاح.', 'success');

        // reset
        this.selectedDevice = null;
        this.formValidator.reset();
        this.titleLabel = 'اختر جهازًا من القائمة!';
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

  onSubmit() {
    if (!this.isSubmit) {
      return;
    }

    if (this.submitButton == 'إضافة') {
      this.addDevice();
    } else {
      this.editDevice();
    }
  }

  onDelete() {
    if (!this.isDelete) {
      return;
    }

    this.deleteDevice();
  }

  restrictPhoneLength(event: any) {
    let input = event.target.value;

    // Ensure input contains at most 8 digits
    if (input.length > 8) {
      event.target.value = input.slice(0, 8);
      this.formValidator.controls['phone'].setValue(input.slice(0, 8));  // Update FormControl
    }
  }

  togglePinHover(deviceId: string, show: boolean): void {
    this.pinHoverState[deviceId] = show;
  }

  // Set initial values when selecting a device
  updateSelectedConnectedDevice(device: Device | null, table: string): void {
    this.selectedDevice = device;

    if (!device) {
      this.submitButton = 'إضافة';
      this.titleLabel = 'اختر جهازًا من القائمة!';
      this.formValidator.reset();
      return;
    }

    this.formValidator.patchValue({
      serial: device.serial,
      name: device.name,
      phone: device.phone == -1 ? '' : device.phone,
      pin: device.pin,
      accounts: this.getAccountDetails(device.accounts),
    });

    this.formValidator.get('serial')?.disable();

    this.formValidator.markAsPristine();  // Mark form as unchanged
    this.formValidator.markAsUntouched(); // Mark form as untouched

    if (table == "connectedDevices") {
      this.submitButton = 'إضافة';
      this.titleLabel = 'تسجيل هاتف جديد';
    } else if (table == "devices") {
      this.submitButton = 'تحديث';
      this.titleLabel = 'تعديل بيانات الهاتف';
    }
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

      if (formName == "phone") {
        const value = this.formValidator.get('phone')?.value;

        if (value.toString().length != 8) {
          this.phoneError = "الرجاء ادخال رقم هاتف صحيح";
          return true;
        }
        else {
          return false;
        }
      }
    }

    return false;
  }

  isFormChanged(): boolean {
    if (!this.selectedDevice) return false;

    const formValue: Device = {
      id: '',
      serial: this.formValidator.get("serial")?.value,
      name: this.formValidator.get("name")?.value,
      phone: this.formValidator.get("phone")?.value,
      pin: this.formValidator.get("pin")?.value,
      accounts: this.formValidator.get("accounts")?.value
    };

    // Compare primitive fields
    if (
      formValue.serial !== this.selectedDevice.serial ||
      formValue.name !== this.selectedDevice.name ||
      formValue.phone !== this.selectedDevice.phone ||
      formValue.pin !== this.selectedDevice.pin
    ) {
      return true;
    }

    // Compare accounts (ensuring the same elements in any order)
    const formAccounts = new Set(formValue.accounts);
    const selectedAccounts = new Set(this.getAccountDetails(this.selectedDevice.accounts));

    if (formAccounts.size !== selectedAccounts.size) {
      return true;
    }

    return false;
  }

  isSubmitDisabled() {
    return !this.isFormChanged() || this.isInvalid('all') || this.isInvalid('phone');
  }


  // Select device when clicking on row
  onRowClick(device: Device, table: string, event?: Event): void {
    if (event) {
      event.stopPropagation(); // Prevents the row click event when clicking the checkbox
    }
    const result = this.selectedDevice === device ? null : device;
    this.updateSelectedConnectedDevice(result, table);
  }

  // Separate method for checkbox selection
  onCheckboxChange(event: MatCheckboxChange, table: string, device: Device): void {
    event.source.checked = event.checked; // Ensure checkbox reflects its state
    const result = event.checked ? device : null;
    this.updateSelectedConnectedDevice(result, table);
  }

  getStatusClass(device: Device): string {
    return device.isConnected ? 'blinking-green' : 'solid-red';
  }

  getAccountDetails(accountIds: string[]): Account[] {
    return this.accounts.filter(account => accountIds.includes(account.id));
  }

  toggleAccountView(account: Account, showFullName: boolean): void {
    account.showFullName = showFullName;
  }

  isConnected(device: Device): boolean {
    return this.connectedDevicesOriginal.some((connectedDevice: Device) => connectedDevice.serial == device.serial);
  }

  ngOnInit(): void {
    this.devicesService.getConnectedDevices();
    this.connectedDevicesSub = this.devicesService.getConnectedDevicesUpdateListener().subscribe((devicesData: any) => {
      this.connectedDevices = devicesData;
      this.connectedDevicesOriginal = devicesData;
      this.connectedDevicesLoaded = true;
      this.updateDevices();
    });

    this.devicesService.getDevices();
    this.devicesSub = this.devicesService.getDevicesUpdateListener().subscribe((devicesData: any) => {
      this.devices = devicesData;
      this.devicesLoaded = true;
      this.updateDevices();
    });


    this.accountsService.getAccounts();
    this.accountsSub = this.accountsService.getAccountsUpdateListener().subscribe((accountsData: any) => {
      this.accounts = accountsData;
    });
  }

  updateDevices() {
    if (!this.connectedDevicesLoaded || !this.devicesLoaded) {
      return;
    }

    if (this.connectedDevices.length == 0 && this.devices.length == 0) {
      this.titleLabel = 'لا يوجد أجهزة متصلة أو مسجلة';
    }

    // remove registered devices from connected devices
    this.connectedDevices = this.connectedDevices.filter((connectedDevice: Device) => {
      return !this.devices.some((device: Device) => device.serial == connectedDevice.serial);
    });

    // update status of each device
    this.devices.forEach((device: Device) => {
      device.isConnected = this.isConnected(device);
    });
  }

  ngOnDestroy(): void {
    this.devicesSub?.unsubscribe();
    this.connectedDevicesSub?.unsubscribe();
    this.accountsSub?.unsubscribe();
  }

}
