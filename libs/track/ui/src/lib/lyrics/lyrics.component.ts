import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-lyrics',
  templateUrl: './lyrics.component.html',
  styleUrls: ['./lyrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsComponent implements OnInit {
  lyrics = '';

  constructor(private bottomSheetRef: MatBottomSheetRef<LyricsComponent>, @Inject(MAT_BOTTOM_SHEET_DATA) private data: { lyrics: string }) {}

  ngOnInit(): void {
    this.lyrics = this.data.lyrics;
  }

  onSave() {
    this.bottomSheetRef.dismiss(this.lyrics);
  }
}
