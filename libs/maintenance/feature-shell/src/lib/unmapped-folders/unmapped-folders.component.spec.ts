import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnmappedFoldersComponent } from './unmapped-folders.component';

describe('UnmappedFoldersComponent', () => {
  let component: UnmappedFoldersComponent;
  let fixture: ComponentFixture<UnmappedFoldersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnmappedFoldersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UnmappedFoldersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
