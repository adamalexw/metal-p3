import { HttpErrorResponse } from '@angular/common/http';
import { SearchRequest } from '@metal-p3/album/domain';
import { MetalArchivesAlbumTrack, Track } from '@metal-p3/api-interfaces';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  addAlbum,
  addAlbums,
  clearAlbums,
  deleteAlbum,
  deleteAlbums,
  deleteAlbumsByPredicate,
  findMaUrl,
  findMaUrlSuccess,
  getBandProps,
  getBandPropsSuccess,
  getCover,
  getCoverSuccess,
  getLyrics,
  getLyricsSuccess,
  getMaTracks,
  getMaTracksSuccess,
  getTracks,
  getTracksSuccess,
  loadAlbums,
  loadAlbumsSuccess,
  mapAlbum,
  mapAlbums,
  renameTrack,
  renameTrackSuccess,
  saveAlbum,
  saveAlbumSuccess,
  saveCover,
  saveCoverSuccess,
  saveTrack,
  saveTrackSuccess,
  setAlbum,
  updateAlbum,
  updateAlbums,
  upsertAlbum,
  upsertAlbums,
} from './actions';
import { createNew, createNewSuccess, renameFolder, renameFolderSuccess, viewAlbum } from './album/actions';
import { Album } from './model';

export const ALBUMS_FEATURE_KEY = 'albums';

export interface AlbumState extends EntityState<Album> {
  loading: boolean;
  loaded: boolean;
  searchRequest?: SearchRequest;
  error?: HttpErrorResponse | Error;
  creatingNew?: boolean;
  selectedAlbum?: number;
}

export const adapter: EntityAdapter<Album> = createEntityAdapter<Album>();
export const trackAdapter: EntityAdapter<Track> = createEntityAdapter<Track>();
export const maTrackAdapter: EntityAdapter<MetalArchivesAlbumTrack> = createEntityAdapter<MetalArchivesAlbumTrack>();

export const initialState = adapter.getInitialState({
  loading: false,
  loaded: false,
});

export const reducer = createReducer(
  initialState,
  on(addAlbum, (state, { album }) => {
    return adapter.addOne(album, state);
  }),
  on(setAlbum, (state, { album }) => {
    return adapter.setOne(album, state);
  }),
  on(upsertAlbum, (state, { album }) => {
    return adapter.upsertOne(album, state);
  }),
  on(addAlbums, (state, { albums }) => {
    return adapter.addMany(albums, state);
  }),
  on(upsertAlbums, (state, { albums }) => {
    return adapter.upsertMany(albums, state);
  }),
  on(updateAlbum, (state, { update }) => {
    return adapter.updateOne(update, state);
  }),
  on(updateAlbums, (state, { updates }) => {
    return adapter.updateMany(updates, state);
  }),
  on(mapAlbum, (state, { entityMap }) => {
    return adapter.mapOne(entityMap, state);
  }),
  on(mapAlbums, (state, { entityMap }) => {
    return adapter.map(entityMap, state);
  }),
  on(deleteAlbum, (state, { id }) => {
    return adapter.removeOne(id, state);
  }),
  on(deleteAlbums, (state, { ids }) => {
    return adapter.removeMany(ids, state);
  }),
  on(deleteAlbumsByPredicate, (state, { predicate }) => {
    return adapter.removeMany(predicate, state);
  }),
  on(loadAlbums, (state, { request }) => {
    return { ...state, searchRequest: request, loading: true };
  }),
  on(loadAlbumsSuccess, (state, { albums }) => {
    return adapter.setAll(albums, { ...state, loading: false, loaded: true });
  }),
  on(clearAlbums, (state) => {
    return adapter.removeAll({ ...state, selectedAlbumId: null });
  }),
  on(viewAlbum, (state, { id }) => {
    return { ...state, selectedAlbum: id };
  }),
  on(findMaUrl, (state, { id }) => {
    return adapter.updateOne({ id, changes: { findingUrl: true } }, state);
  }),
  on(findMaUrlSuccess, (state, { update }) => {
    return adapter.updateOne(update, state);
  }),
  on(saveAlbum, (state, { album }) => {
    return adapter.updateOne({ id: album.id, changes: { saving: true } }, state);
  }),
  on(saveAlbumSuccess, (state, { update }) => {
    return adapter.updateOne(update, state);
  }),
  on(createNew, (state) => ({ ...state, creatingNew: true })),
  on(createNewSuccess, (state) => ({ ...state, creatingNew: false })),
  on(renameFolder, (state, { id }) => adapter.updateOne({ id, changes: { renamingFolder: true } }, state)),
  on(renameFolderSuccess, (state, { update }) => adapter.updateOne(update, state)),

  /** COVER */
  on(getCover, (state, { id }) => {
    return adapter.updateOne({ id, changes: { coverLoading: true } }, state);
  }),
  on(getCoverSuccess, (state, { update }) => {
    return adapter.updateOne(update, state);
  }),
  on(saveCover, (state, { id }) => {
    return adapter.updateOne({ id: id, changes: { savingCover: true } }, state);
  }),
  on(saveCoverSuccess, (state, { update }) => {
    return adapter.updateOne(update, state);
  }),

  /** TRACK */
  on(getTracks, (state, { id }) => {
    return adapter.updateOne({ id, changes: { tracksLoading: true } }, state);
  }),
  on(getTracksSuccess, (state, { id, tracks }) =>
    adapter.updateOne(
      {
        id,
        changes: {
          tracks: trackAdapter.setAll(tracks, state),
          tracksLoading: false,
        },
      },
      state
    )
  ),
  on(saveTrack, (state, { id, track }) =>
    adapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          tracks: trackAdapter.updateOne({ id: track.id, changes: { ...track, trackSaving: true } }, album.tracks),
        }),
      },
      state
    )
  ),
  on(saveTrackSuccess, (state, { id, track }) =>
    adapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          tracks: trackAdapter.updateOne({ id: track.id, changes: { ...track, trackSaving: false } }, album.tracks),
        }),
      },
      state
    )
  ),
  on(getLyrics, (state, { id }) => {
    return adapter.updateOne({ id, changes: { gettingLyrics: true } }, state);
  }),
  on(getLyricsSuccess, (state, { id, trackId, lyrics }) =>
    adapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          maTracks: maTrackAdapter.map((track) => (track.id === trackId ? { ...track, lyrics } : track), album.maTracks),
        }),
      },
      state
    )
  ),
  on(getMaTracks, (state, { id }) => {
    return adapter.updateOne({ id, changes: { gettingMaTracks: true } }, state);
  }),
  on(getMaTracksSuccess, (state, { id, maTracks }) =>
    adapter.updateOne(
      {
        id,
        changes: {
          maTracks: maTrackAdapter.setAll(maTracks, state),
          gettingMaTracks: false,
        },
      },
      state
    )
  ),
  on(renameTrack, (state, { id, track }) =>
    adapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          tracks: trackAdapter.updateOne({ id: track.id, changes: { ...track, trackSaving: true } }, album.tracks),
        }),
      },
      state
    )
  ),
  on(renameTrackSuccess, (state, { id, track }) =>
    adapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          tracks: trackAdapter.updateOne({ id: track.id, changes: { ...track, trackSaving: false } }, album.tracks),
        }),
      },
      state
    )
  ),

  /** BAND */
  on(getBandProps, (state, { id }) => {
    return adapter.updateOne({ id, changes: { gettingBandProps: true } }, state);
  }),
  on(getBandPropsSuccess, (state, { update }) => {
    return adapter.updateOne(update, state);
  })
);
