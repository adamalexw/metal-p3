import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraFilesComponent } from './extra-files.component';

describe('ExtraFilesComponent', () => {
  let component: ExtraFilesComponent;
  let fixture: ComponentFixture<ExtraFilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExtraFilesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtraFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
