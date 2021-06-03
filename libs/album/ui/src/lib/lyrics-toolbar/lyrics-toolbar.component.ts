import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-lyrics-toolbar',
  templateUrl: './lyrics-toolbar.component.html',
  styleUrls: ['./lyrics-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsToolbarComponent implements OnInit {
  @Input()
  applying = false;

  @Output()
  apply = new EventEmitter<void>();
  constructor() {}

  ngOnInit(): void {}
}
