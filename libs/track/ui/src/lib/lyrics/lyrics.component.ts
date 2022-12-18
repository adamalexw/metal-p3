import { ChangeDetectionStrategy, Component, HostBinding, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBottomSheetModule, MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatInputModule, MatBottomSheetModule],
  selector: 'app-lyrics',
  templateUrl: './lyrics.component.html',
  styleUrls: ['./lyrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsComponent implements OnInit {
  @HostBinding('class')
  hostClass = 'flex flex-col';

  lyrics = '';

  constructor(private bottomSheetRef: MatBottomSheetRef<LyricsComponent>, @Inject(MAT_BOTTOM_SHEET_DATA) private data: { lyrics: string }) {}

  ngOnInit(): void {
    this.lyrics = this.data.lyrics;
  }

  onSave() {
    this.bottomSheetRef.dismiss(this.lyrics);
  }
}
