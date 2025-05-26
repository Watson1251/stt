import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AngularMaterialModule } from '../../modules/angular-material.module';

@Component({
  selector: 'app-paginator',
  imports: [AngularMaterialModule],
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.scss'
})
export class PaginatorComponent {

  @Input() data: any[] = [];
  @Output() paginatedData = new EventEmitter<any[]>();

  length = 0;
  pageSize = 5;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];

  hidePageSize = false;
  showPageSizeOptions = true;
  showFirstLastButtons = true;
  disabled = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    if (this.paginator) {
      this.paginator._intl.itemsPerPageLabel = 'العناصر:';
      this.paginator._intl.firstPageLabel = 'الصفحة الأولى';
      this.paginator._intl.previousPageLabel = 'الصفحة السابقة';
      this.paginator._intl.nextPageLabel = 'الصفحة التالية';
      this.paginator._intl.lastPageLabel = 'الصفحة الأخيرة';
      this.paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
        if (length === 0) {
          return `0 من ${length}`;
        }
        const start = page * pageSize + 1;
        const end = Math.min((page + 1) * pageSize, length);
        return `${start} - ${end} من ${length}`;
      };
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && changes['data'].currentValue) {
      this.data = changes['data'].currentValue;
      this.length = this.data.length;
      this.updatePaginatedData();
    }
  }

  get disableFirstPrev(): boolean {
    return this.pageIndex === 0;
  }

  get disableNextLast(): boolean {
    return this.pageIndex >= Math.ceil(this.length / this.pageSize) - 1;
  }


  handlePageEvent(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.length = this.data.length;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.data.length);
    setTimeout(() => {
      this.paginatedData.emit(this.data.slice(startIndex, endIndex));
    });
  }
}
