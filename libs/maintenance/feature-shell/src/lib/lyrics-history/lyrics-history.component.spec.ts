import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LyricsHistoryShellComponent } from './lyrics-history.component';

describe('LyricsHistoryComponent', () => {
  let component: LyricsHistoryShellComponent;
  let fixture: ComponentFixture<LyricsHistoryShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LyricsHistoryShellComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LyricsHistoryShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
