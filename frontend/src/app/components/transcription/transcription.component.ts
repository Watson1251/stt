import { Component, Input, ViewChild } from '@angular/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MAT_MOMENT_DATE_FORMATS,
} from '@angular/material-moment-adapter';
import {
  MAT_DATE_LOCALE,
  DateAdapter,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import {
  SegmentModel,
  TranscriptionModel,
} from 'src/app/models/transcription.model';
import { Helper } from '../helpers';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';


interface RowData {
  id: number;
  segmentId: string;
  text: string;
  isProcessed: boolean;
}

@Component({
  selector: 'app-transcription',
  templateUrl: './transcription.component.html',
  styleUrls: ['./transcription.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'ar' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
  ],
})
export class TranscriptionComponent {
  @Input() transcription: TranscriptionModel | null = null;

  segments: SegmentModel[] = [];

  Helper = Helper;

  shownRows: RowData[] = [];

  displayedColumns: string[] = ['id', 'timestamp', 'text', 'isProcessed'];

  dataSource: MatTableDataSource<RowData> = new MatTableDataSource<RowData>([]);
  selection = new SelectionModel<RowData>(true, []);

  searchValue: string = '';

  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  @ViewChild(MatSort, { static: false }) set setSort(content: any) {
    if (content) {
      setTimeout(() => {
        this.sort = content;
        if (this.dataSource) {
          this.dataSource.sort = this.sort as MatSort;
        }
      });
    }
  }

  updateSegments() {
    if (!this.transcription) {
      this.segments = [];
      this.shownRows = [];
      this.dataSource.data = [];
      return;
    }

    this.segments = this.transcription.segments || [];
    this.shownRows = this.generateRows();
    this.dataSource = new MatTableDataSource(this.shownRows);
  }

  generateRows() {
    var rowData: RowData[] = [];

    for (let i = 1; i <= this.segments.length; i++) {
      const segment = this.segments[i - 1];

      const data: RowData = {
        id: i,
        segmentId: segment.id,
        text: segment.text || '',
        isProcessed: segment.status === 'processed',
      };

      rowData.push(data);
    }

    return rowData;
  }

  ngOnInit() {
    console.log(this.transcription);
  }

  ngOnDestroy() { }
}
