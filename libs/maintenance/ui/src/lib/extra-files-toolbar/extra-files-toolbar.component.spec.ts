import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraFilesToolbarComponent } from './extra-files-toolbar.component';

describe('ExtraFilesToolbarComponent', () => {
  let component: ExtraFilesToolbarComponent;
  let fixture: ComponentFixture<ExtraFilesToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExtraFilesToolbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtraFilesToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
