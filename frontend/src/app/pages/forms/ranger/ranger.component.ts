import { Component } from '@angular/core';
import { Options } from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-range',
  templateUrl: './ranger.component.html',
  styleUrls: ['./ranger.component.scss']
})
export class RangerComponent {

  // bread crum items
  breadCrumbItems!: Array<{}>;

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'Forms' }, { label: 'Range Slider', active: true }];
  }

  /**
* Slider range set
*/
  defaultVal: number = 34;
  option: Options = {
    floor: 0,
    ceil: 100
  };

  value = 40;
  highValue = 60;
  options: Options = {
    floor: 0,
    ceil: 100
  };

  custom = 12;
  customOption: Options = {
    floor: 10,
    ceil: 100,
    step: 5
  };

  floatValue = 0.5;
  floatingOptions: Options = {
    floor: 0,
    ceil: 2,
    step: 0.1
  };

  value1 = 100;
  minVal = 100;
  maxVal = 400;
  option1: Options = {
    floor: 0,
    ceil: 500,
    translate: (value: number): string => {
      return '$' + value;
    }
  };

  tickvalue = 10;
  tickhighValue = 90;
  tickoptions: Options = {
    floor: 0,
    ceil: 100,
    step: 10,
    showTicks: true
  };

  draggableminValue = 5;
  draggablemaxValue = 8;
  draggableoptions: Options = {
    floor: 0,
    ceil: 10,
    draggableRange: true
  };

  tickValue = 5;
  tickValueoptions: Options = {
    showTicksValues: true,
    stepsArray: [
      { value: 1, legend: 'Very poor' },
      { value: 2 },
      { value: 3, legend: 'Fair' },
      { value: 4 },
      { value: 5, legend: 'Average' },
      { value: 6 },
      { value: 7, legend: 'Good' },
      { value: 8 },
      { value: 9, legend: 'Excellent' }
    ]
  };

  visibleSelection = 5;
  visibleBarOptions: Options = {
    floor: 0,
    ceil: 10,
    showSelectionBar: true
  };

  logscale = 1;
  logscaleoptions: Options = {
    floor: 1,
    ceil: 100,
    logScale: true,
    showTicks: true
  };

  value10 = 10;
  highValue10: number = 90;
  options10: Options = {
    floor: 0,
    ceil: 100,
    step: 10,
    showTicks: true
  };

}
