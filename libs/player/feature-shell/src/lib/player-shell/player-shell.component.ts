import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { playTrack, selectPlaylist, selectTrack } from '@metal-p3/player/data-access';
import { select, Store } from '@ngrx/store';

@Component({
  selector: 'app-player-shell',
  templateUrl: './player-shell.component.html',
  styleUrls: ['./player-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerShellComponent implements OnInit {
  playlist$ = this.store.pipe(select(selectPlaylist));
  selectedTrack$ = this.store.pipe(select(selectTrack));

  constructor(private store: Store) {}

  ngOnInit(): void {}

  onPlayItem(id: string) {
    this.store.dispatch(playTrack({ id }));
  }
}
