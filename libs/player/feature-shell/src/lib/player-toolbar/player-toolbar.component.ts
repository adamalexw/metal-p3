import { ChangeDetectionStrategy, Component } from '@angular/core';
import { selectMiniMode, selectPlaylist, tooglePlayerView } from '@metal-p3/player/data-access';
import { UntilDestroy } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { map, shareReplay } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-player-toolbar',
  templateUrl: './player-toolbar.component.html',
  styleUrls: ['./player-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerToolbarComponent {
  miniMode$ = this.store.pipe(select(selectMiniMode)).pipe(shareReplay());
  stateIcon$ = this.miniMode$.pipe(map((miniMode) => (miniMode ? 'expand_more' : 'expand_less')));
  playlist$ = this.store.pipe(
    select(selectPlaylist),
    map((playlist) => playlist?.length)
  );

  constructor(private store: Store) {}

  onToogleView() {
    this.store.dispatch(tooglePlayerView());
  }
}
