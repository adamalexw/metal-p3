import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PlaylistItem } from '@metal-p3/player/domain';

@Component({
  selector: 'app-player-controls',
  templateUrl: './player-controls.component.html',
  styleUrls: ['./player-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerControlsComponent implements OnInit {
  @Input()
  isFirstPlaying = false;

  @Input()
  isLastPlaying = false;

  @Input()
  currentItem: PlaylistItem | undefined;

  @Output()
  readonly previous = new EventEmitter<void>();

  @Output()
  readonly play = new EventEmitter<void>();

  @Output()
  readonly pause = new EventEmitter<void>();

  @Output()
  readonly next = new EventEmitter<void>();

  constructor() {}

  ngOnInit(): void {}
}
