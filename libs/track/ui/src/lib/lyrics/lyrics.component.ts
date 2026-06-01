import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export type LyricsSheetSource = 'synced' | 'plain';

export interface LyricsSheetData {
  text: string;
  source?: LyricsSheetSource;
}

const LRC_TIMESTAMP_LINE = /^\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]\s*/;
const LRC_METADATA_LINE = /^\[(?:ar|ti|al|au|by|length|offset|re|tool|ve):/i;

export function stripLrcTimestamps(text: string): string {
  return text
    .split(/\r?\n/)
    .filter((line) => !LRC_METADATA_LINE.test(line.trim()))
    .map((line) => line.replace(LRC_TIMESTAMP_LINE, ''))
    .join('\n');
}

@Component({
  imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatInputModule, MatBottomSheetModule],
  selector: 'app-lyrics',
  templateUrl: './lyrics.component.html',
  styleUrls: ['./lyrics.component.scss'],
  host: {
    class: 'flex flex-col',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsComponent implements OnInit {
  private readonly bottomSheetRef = inject(MatBottomSheetRef<LyricsComponent>);
  private readonly data: LyricsSheetData = inject(MAT_BOTTOM_SHEET_DATA);

  lyrics = '';
  source: LyricsSheetSource = 'plain';

  ngOnInit(): void {
    this.source = this.data.source ?? 'plain';
    const raw = this.data.text ?? '';
    this.lyrics = this.source === 'synced' ? stripLrcTimestamps(raw) : raw;
  }

  onSave() {
    if (this.source === 'synced') {
      this.bottomSheetRef.dismiss();
      return;
    }
    this.bottomSheetRef.dismiss(this.lyrics);
  }
}
