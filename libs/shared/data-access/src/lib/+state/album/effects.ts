import { Inject, Injectable } from '@angular/core';
import { AlbumService } from '@metal-p3/album/data-access';
import { BASE_PATH } from '@metal-p3/album/domain';
import { BandDto, MetalArchivesSearchResponse } from '@metal-p3/api-interfaces';
import { CoverService } from '@metal-p3/cover/data-access';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { extractUrl, nonNullable } from '@metal-p3/shared/utils';
import { Track } from '@metal-p3/track/domain';
import { WINDOW } from '@ng-web-apis/common';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { EMPTY, iif, of, throwError } from 'rxjs';
import { catchError, concatMap, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { CoverActions } from '../actions';
import { BandActions } from '../band/actions';
import { Album, AlbumDtoToAlbum } from '../model';
import { selectTracks } from '../selectors';
import { TrackActions } from '../track/actions';
import { AlbumActions } from './actions';

@Injectable()
export class AlbumEffects {
  loadAlbums$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.loadAlbums, AlbumActions.cancelPreviousSearch),
      switchMap(({ request }) =>
        iif(
          () => !!request.cancel,
          of(AlbumActions.cancelPreviousSearchSuccess()),
          this.service.getAlbums(request).pipe(
            map((albums) => albums as Album[]),
            map((albums) => (!request.skip ? AlbumActions.loadAlbumsSuccess({ albums }) : AlbumActions.loadAlbumsPageSuccess({ albums }))),
            catchError((error) => of(AlbumActions.loadAlbumsError({ loadError: error })))
          )
        )
      )
    );
  });

  loadAlbumsSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.loadAlbumsSuccess, AlbumActions.loadAlbumsPageSuccess),
      map(({ albums }) => CoverActions.getMany({ request: { requests: albums.map((a) => ({ id: a.id, folder: a.folder })) } }))
    );
  });

  getAlbum$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.getAlbum),
      mergeMap(({ id }) =>
        this.service.getAlbum(id).pipe(
          map((album) => AlbumDtoToAlbum(album) as Album),
          map((album) => AlbumActions.addAlbum({ album })),
          catchError((error) => of(AlbumActions.getAlbumError({ update: { id, changes: { getError: this.errorService.getError(error) } } })))
        )
      )
    );
  });

  addNewAlbum$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.addNewAlbum),
      mergeMap(({ folder }) =>
        this.service.addNewAlbum(`${this.basePath}/${folder}`).pipe(
          nonNullable(),
          tap((album) => this.notificationService.showInfo(album.folder, 'New Album')),
          map((album) => AlbumDtoToAlbum(album) as Album),
          concatMap((album) => this.coverService.getCover(`${this.basePath}/${album.folder}`).pipe(map((cover) => ({ ...album, cover })))),
          map((album) => AlbumActions.addAlbum({ album })),
          catchError((error) => {
            this.notificationService.showError(`${folder}: ${this.errorService.getError(error)}`, 'New Album');
            return of(AlbumActions.addNewAlbumError({ error }));
          })
        )
      )
    );
  });

  extraFiles$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.getExtraFiles),
      mergeMap(({ id, folder }) =>
        this.service.getExtraFiles(folder).pipe(
          map((extraFiles) => AlbumActions.setExtraFiles({ update: { id, changes: { extraFiles } } })),
          catchError((error) => {
            this.notificationService.showError(`${folder}: ${this.errorService.getError(error)}`, 'Extra Files');
            return of(AlbumActions.setExtraFiles({ update: { id, changes: { extraFiles: false } } }));
          })
        )
      )
    );
  });

  saveAlbum$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.saveAlbum),
      mergeMap(({ album }) =>
        this.service.saveAlbum(album).pipe(
          map(() => {
            const { cover: _, ...rest } = album;
            return rest;
          }),
          map((album) => AlbumActions.saveAlbumSuccess({ update: { id: album.id, changes: { ...album, saving: false, saveError: undefined } } })),
          catchError((error) => of(AlbumActions.saveAlbumError({ update: { id: album.id, changes: { saving: false, saveError: this.errorService.getError(error) } } })))
        )
      )
    );
  });

  saveAlbumSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.saveAlbumSuccess),
      map(({ update }) => {
        const { changes: album } = update;

        const band: BandDto = {
          id: album.bandId ?? 0,
          name: album.artist || '',
          country: album.country,
          genre: album.genre,
          metalArchiveUrl: album.artistUrl,
        };

        return BandActions.save({ band });
      })
    );
  });

  setHasLyrics$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.setHasLyrics),
      mergeMap(({ id, hasLyrics }) =>
        this.service.setHasLyrics(id, hasLyrics).pipe(
          map(() => AlbumActions.updateAlbum({ update: { id, changes: { hasLyrics } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    );
  });

  setTransferred$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.setTransferred),
      mergeMap(({ id, transferred }) =>
        this.service.setTransferred(id, transferred).pipe(
          map(() => AlbumActions.updateAlbum({ update: { id, changes: { transferred } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    );
  });

  findMaUrl$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.findMetalArchivesUrl),
      mergeMap(({ id, artist, album }) =>
        this.service.findMaUrl(artist, album).pipe(
          mergeMap((response) => {
            if (response.iTotalRecords > 1) {
              this.windowRef.open(`https://www.metal-archives.com/search/advanced/searching/albums?bandName=${encodeURI(artist)}&releaseTitle=${encodeURI(album)}`);
              return throwError(() => new Error('too many results'));
            }
            if (response.iTotalRecords === 0) {
              this.windowRef.open(`https://www.metal-archives.com/search/advanced/searching/albums?bandName=${encodeURI(artist)}`);
              return throwError(() => new Error('no results'));
            }

            return of(response);
          }),
          filter((response) => response.iTotalRecords === 1),
          map((response: MetalArchivesSearchResponse) => {
            return { artistUrl: extractUrl(response.aaData[0][0]), albumUrl: extractUrl(response.aaData[0][1]) };
          }),
          map(({ artistUrl, albumUrl }) => AlbumActions.findMetalArchivesUrlSuccess({ update: { id, changes: { artistUrl, albumUrl, findingUrl: false } } })),
          catchError((error) => {
            console.error(error);
            return of(AlbumActions.findMetalArchivesUrlSuccess({ update: { id, changes: { findingUrl: false } } }));
          })
        )
      )
    );
  });

  renameFolder$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.renameFolder),
      map(({ id, src, artist, album }) => ({ id, src, dest: `${artist} - ${album}` })),
      mergeMap(({ id, src, dest }) =>
        this.service.renameFolder(id, src, dest).pipe(
          map(({ fullPath, folder }) => AlbumActions.renameFolderSuccess({ update: { id, changes: { fullPath, folder, renamingFolder: false, renamingFolderError: undefined } } })),
          catchError((error) => of(AlbumActions.renameFolderError({ update: { id, changes: { renamingFolder: false, renamingFolderError: this.errorService.getError(error) } } })))
        )
      )
    );
  });

  renameFolderSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.renameFolderSuccess),
      map(({ update }) => ({ id: update.id, fullPath: update.changes.fullPath })),
      concatLatestFrom(() => this.store.select(selectTracks)),
      filter(([_, tracks]) => !!tracks),
      map(([{ id, fullPath }, tracks]) => {
        const updates = (tracks || []).map((track) => ({ id: track.id, changes: { folder: fullPath, fullPath: `${fullPath}/${track.file}` } })) as Update<Track>[];

        return TrackActions.updateTracksSuccess({ id: +id, updates });
      })
    );
  });

  createNew$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.createNew),
      mergeMap(() =>
        // folder watcher will pick up these new folders
        this.service.createAlbumFromRootFiles().pipe(
          map(() => AlbumActions.createNewSuccess()),
          catchError((error) => {
            this.notificationService.showError(`${this.errorService.getError(error)}`, 'Create New Album');
            return EMPTY;
          })
        )
      )
    );
  });

  deleteAlbum$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.deleteAlbum),
      mergeMap(({ id }) =>
        this.service.deleteAlbum(id).pipe(
          map(() => AlbumActions.deleteAlbumSuccess({ id })),
          catchError((error) => {
            this.notificationService.showError(`${this.errorService.getError(error)}`, 'Delete Album');
            return of(AlbumActions.deleteAlbumError({ id, error }));
          })
        )
      )
    );
  });

  constructor(
    private actions$: Actions,
    private service: AlbumService,
    private coverService: CoverService,
    private store: Store,
    private notificationService: NotificationService,
    private errorService: ErrorService,
    @Inject(WINDOW) readonly windowRef: Window,
    @Inject(BASE_PATH) private readonly basePath: string
  ) {}
}
