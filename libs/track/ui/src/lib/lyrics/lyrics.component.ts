import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

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
  private readonly data: { lyrics: string } = inject(MAT_BOTTOM_SHEET_DATA);

  lyrics = '';

  ngOnInit(): void {
    this.lyrics = this.data.lyrics;
  }

  onSave() {
    this.bottomSheetRef.dismiss(this.lyrics);
  }
}
