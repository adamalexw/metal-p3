import { inject, Injectable } from '@angular/core';
import { PlaylistDto } from '@metal-p3/playlist/domain';
import { PlaylistService } from '@metal-p3/playlist/data-access';
import { ErrorService } from '@metal-p3/shared/error';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { catchError, concatMap, map, of } from 'rxjs';
import { SetlistImporterService } from '../setlist-importer.service';
import { SetlistImporterActions } from './actions';
import { selectSetlistImporterSetlists, selectSetlistImporterTracks, selectSetlistImporterUrls } from './selectors';

@Injectable()
export class SetlistImporterEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly service = inject(SetlistImporterService);
  private readonly playlistService = inject(PlaylistService);
  private readonly errorService = inject(ErrorService);

  scrape$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SetlistImporterActions.scrape),
      concatLatestFrom(() => this.store.select(selectSetlistImporterUrls)),
      concatMap(([_, urls]) =>
        this.service.scrape(urls).pipe(
          map((setlists) => SetlistImporterActions.scrapeSuccess({ setlists })),
          catchError((error) => of(SetlistImporterActions.scrapeError({ error: this.errorService.getError(error) }))),
        ),
      ),
    );
  });

  matchAfterScrape$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SetlistImporterActions.scrapeSuccess),
      map(() => SetlistImporterActions.match()),
    );
  });

  match$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SetlistImporterActions.match),
      concatLatestFrom(() => this.store.select(selectSetlistImporterSetlists)),
      concatMap(([_, setlists]) =>
        this.service.match(setlists).pipe(
          map((tracks) => SetlistImporterActions.matchSuccess({ tracks })),
          catchError((error) => of(SetlistImporterActions.matchError({ error: this.errorService.getError(error) }))),
        ),
      ),
    );
  });

  createPlaylist$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SetlistImporterActions.createPlaylist),
      concatLatestFrom(() => this.store.select(selectSetlistImporterTracks)),
      map(([{ name }, tracks]) => {
        const items = tracks
          .filter((t): t is typeof t & { match: NonNullable<typeof t.match> } => t.selected && !!t.match)
          .map((t, index) => ({ id: -1, playlistId: -1, itemPath: t.match.fullPath, itemIndex: index }));

        const dto: PlaylistDto = { id: -1, name, items };
        return dto;
      }),
      concatMap((dto) =>
        this.playlistService.createPlaylist(dto).pipe(
          map((playlist) => SetlistImporterActions.createPlaylistSuccess({ playlist })),
          catchError((error) => of(SetlistImporterActions.createPlaylistError({ error: this.errorService.getError(error) }))),
        ),
      ),
    );
  });
}
