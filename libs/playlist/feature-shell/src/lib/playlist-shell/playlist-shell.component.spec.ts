import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistShellComponent } from './playlist-shell.component';

describe('PlaylistShellComponent', () => {
  let component: PlaylistShellComponent;
  let fixture: ComponentFixture<PlaylistShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlaylistShellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaylistShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
