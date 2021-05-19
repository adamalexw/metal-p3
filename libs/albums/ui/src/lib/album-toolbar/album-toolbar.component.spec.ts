import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlbumToolbarComponent } from './album-toolbar.component';

describe('AlbumToolbarComponent', () => {
  let component: AlbumToolbarComponent;
  let fixture: ComponentFixture<AlbumToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AlbumToolbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AlbumToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
