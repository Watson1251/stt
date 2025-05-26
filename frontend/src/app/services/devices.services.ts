import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Subject, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { SnackbarService } from "./snackbar.service";
import { Device } from "../models/device.model";
import { EnvironmentService } from "./environment.service";


@Injectable({ providedIn: "root" })
export class DevicesService {

  private devices: Device[] = [];
  private devicesUpdated = new Subject<any>();

  private connectedDevices: Device[] = [];
  private connectedDevicesUpdated = new Subject<any>();

  constructor(
    private http: HttpClient,
    private envService: EnvironmentService,
    private snackbarService: SnackbarService
  ) { }

  getConnectedDevices() {
    this.http
      .get<any>(
        this.envService.apiUrl('devices/connected/'),
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

          var fetchedDevices = response.body;
          var tempDevices: Device[] = [];

          fetchedDevices.forEach((item: any) => {
            const device: Device = {
              id: "",
              name: "",
              serial: item.device_id,
              phone: -1,
              pin: "",
              accounts: [],
            };
            tempDevices.push(device);
          });

          this.connectedDevices = tempDevices;
          this.connectedDevicesUpdated.next(this.connectedDevices);
        }
      });
  }

  getDevices() {
    this.http
      .get<{ message: string, devices: any }>(
        this.envService.apiUrl('devices/'),
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

          var fetchedDevices = response.body.devices;
          var tempDevices: Device[] = [];

          fetchedDevices.forEach((item: any) => {
            const device: Device = {
              id: item._id,
              name: item.name,
              serial: item.serial,
              phone: Number(item.phone),
              pin: item.pin,
              accounts: item.accounts,
            };
            tempDevices.push(device);
          });

          this.devices = tempDevices;
          this.devicesUpdated.next(this.devices);
        }
      });
  }

  // getRole(id: string) {
  //   console.log(id);
  //   return this.http
  //     .get<any>(
  //       BACKEND_URL + id,
  //       {observe: 'response'}
  //     )
  //     .pipe(
  //       catchError((error: HttpErrorResponse) => {
  //           return this.handleError(error);
  //       })
  //     );
  // }

  createDevice(device: Device) {
    return this.http
      .post<any>(
        this.envService.apiUrl('devices/create/'),
        device,
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  updateDevice(device: Device) {
    return this.http
      .post<any>(
        this.envService.apiUrl('devices/update/'),
        device,
        { observe: 'response' }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  deleteDevice(device: Device) {
    return this.http
      .post<any>(
        this.envService.apiUrl('devices/delete/'),
        device,
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

  getDevicesUpdateListener() {
    return this.devicesUpdated.asObservable();
  }

  getConnectedDevicesUpdateListener() {
    return this.connectedDevicesUpdated.asObservable();
  }

}
