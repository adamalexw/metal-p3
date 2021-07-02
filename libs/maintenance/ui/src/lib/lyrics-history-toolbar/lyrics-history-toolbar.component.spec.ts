import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LyricsHistoryToolbarComponent } from './lyrics-history-toolbar.component';

describe('LyricsHistoryToolbarComponent', () => {
  let component: LyricsHistoryToolbarComponent;
  let fixture: ComponentFixture<LyricsHistoryToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LyricsHistoryToolbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LyricsHistoryToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
