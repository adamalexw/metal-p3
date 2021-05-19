import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LyricsToolbarComponent } from './lyrics-toolbar.component';

describe('LyricsToolbarComponent', () => {
  let component: LyricsToolbarComponent;
  let fixture: ComponentFixture<LyricsToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LyricsToolbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LyricsToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
