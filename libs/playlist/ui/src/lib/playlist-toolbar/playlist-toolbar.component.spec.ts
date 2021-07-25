import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistToolbarComponent } from './playlist-toolbar.component';

describe('PlaylistToolbarComponent', () => {
  let component: PlaylistToolbarComponent;
  let fixture: ComponentFixture<PlaylistToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlaylistToolbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaylistToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
