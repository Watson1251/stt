import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Helper } from '../helpers';

@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss'],
})
export class PaginatorComponent {
  @Input() dataSource: MatTableDataSource<any> | undefined;
  @Output() pageChange = new EventEmitter<PageEvent>(); // <-- ADD THIS

  Helper = Helper;

  length = 5;
  pageSize = 5;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];

  hidePageSize = false;
  showPageSizeOptions = true;
  showFirstLastButtons = true;
  disabled = false;

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatPaginator, { static: false }) set setPaginator(content: any) {
    if (content) {
      setTimeout(() => {
        this.paginator = content as MatPaginator;

        this.paginator._intl.itemsPerPageLabel = 'العناصر:';
        this.paginator._intl.firstPageLabel = 'الصفحة الأولى';
        this.paginator._intl.previousPageLabel = 'الصفحة السابقة';
        this.paginator._intl.nextPageLabel = 'الصفحة التالية';
        this.paginator._intl.lastPageLabel = 'الصفحة الأخيرة';
        this.paginator._intl.getRangeLabel = (
          page: number,
          pageSize: number,
          length: number
        ) => {
          const start = page * pageSize + 1;
          const end = (page + 1) * pageSize;
          const endLength = Math.min(end, length);
          return `${start.toString()} إلى ${endLength.toString()} من ${length.toString()}`;
        };

        if (this.dataSource) {
          this.dataSource.paginator = this.paginator;
        }
      });
    }
  }

  pageEvent?: PageEvent;

  handlePageEvent(e: PageEvent) {
    this.pageEvent = e;
    this.length = e.length;
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
    this.pageChange.emit(e); // <-- Emit event
  }

  ngOnInit() {
    if (this.dataSource) {
      this.length = this.dataSource.data.length;
      this.dataSource.paginator = this.paginator;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dataSource'] && changes['dataSource'].currentValue) {
      if (!this.dataSource) return;
      this.length = this.dataSource.data.length;
      this.dataSource.paginator = this.paginator;
    }
  }
}
