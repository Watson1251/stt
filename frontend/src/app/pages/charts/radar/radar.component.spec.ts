import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RadarComponent } from './radar.component';

describe('RadarComponent', () => {
  let component: RadarComponent;
  let fixture: ComponentFixture<RadarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RadarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RadarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
