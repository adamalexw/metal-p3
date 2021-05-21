import { HttpErrorResponse } from '@angular/common/http';
import { SearchRequest } from '@metal-p3/albums/domain';
import { MetalArchivesAlbumTrack, Track } from '@metal-p3/api-interfaces';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, on } from '@ngrx/store';
import { Album } from '../album';
import * as AlbumActions from './actions';

export const ALBUMS_FEATURE_KEY = 'albums';

export interface AlbumState extends EntityState<Album> {
  loading: boolean;
  loaded: boolean;
  searchRequest?: SearchRequest;
  error?: HttpErrorResponse | Error;
}

export const adapter: EntityAdapter<Album> = createEntityAdapter<Album>();
export const trackAdapter: EntityAdapter<Track> = createEntityAdapter<Track>();
export const maTrackAdapter: EntityAdapter<MetalArchivesAlbumTrack> = createEntityAdapter<MetalArchivesAlbumTrack>();

export const initialState = adapter.getInitialState({
  loading: true,
  loaded: false,
});

const albumReducer = createReducer(
  initialState,
  on(AlbumActions.addAlbum, (state, { album }) => {
    return adapter.addOne(album, state);
  }),
  on(AlbumActions.setAlbum, (state, { album }) => {
    return adapter.setOne(album, state);
  }),
  on(AlbumActions.upsertAlbum, (state, { album }) => {
    return adapter.upsertOne(album, state);
  }),
  on(AlbumActions.addAlbums, (state, { albums }) => {
    return adapter.addMany(albums, state);
  }),
  on(AlbumActions.upsertAlbums, (state, { albums }) => {
    return adapter.upsertMany(albums, state);
  }),
  on(AlbumActions.updateAlbum, (state, { update }) => {
    return adapter.updateOne(update, state);
  }),
  on(AlbumActions.updateAlbums, (state, { updates }) => {
    return adapter.updateMany(updates, state);
  }),
  on(AlbumActions.mapAlbum, (state, { entityMap }) => {
    return adapter.mapOne(entityMap, state);
  }),
  on(AlbumActions.mapAlbums, (state, { entityMap }) => {
    return adapter.map(entityMap, state);
  }),
  on(AlbumActions.deleteAlbum, (state, { id }) => {
    return adapter.removeOne(id, state);
  }),
  on(AlbumActions.deleteAlbums, (state, { ids }) => {
    return adapter.removeMany(ids, state);
  }),
  on(AlbumActions.deleteAlbumsByPredicate, (state, { predicate }) => {
    return adapter.removeMany(predicate, state);
  }),
  on(AlbumActions.loadAlbums, (state, { request }) => {
    return { ...state, searchRequest: request, loading: true };
  }),
  on(AlbumActions.loadAlbumsSuccess, (state, { albums }) => {
    return adapter.setAll(albums, { ...state, loading: false, loaded: true });
  }),
  on(AlbumActions.clearAlbums, (state) => {
    return adapter.removeAll({ ...state, selectedAlbumId: null });
  }),
  on(AlbumActions.getCover, (state, { id }) => {
    return adapter.updateOne({ id, changes: { coverLoading: true } }, state);
  }),
  on(AlbumActions.getCoverSuccess, (state, { update }) => {
    return adapter.updateOne(update, state);
  }),
  on(AlbumActions.getTracks, (state, { id }) => {
    return adapter.updateOne({ id, changes: { tracksLoading: true } }, state);
  }),
  on(AlbumActions.getTracksSuccess, (state, { id, tracks }) =>
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
  on(AlbumActions.findMaUrl, (state, { id }) => {
    return adapter.updateOne({ id, changes: { findingUrl: true } }, state);
  }),
  on(AlbumActions.findMaUrlSuccess, (state, { update }) => {
    return adapter.updateOne(update, state);
  }),
  on(AlbumActions.saveAlbum, (state, { album }) => {
    return adapter.updateOne({ id: album.id, changes: { saving: true } }, state);
  }),
  on(AlbumActions.saveAlbumSuccess, (state, { update }) => {
    return adapter.updateOne(update, state);
  }),
  on(AlbumActions.saveTrack, (state, { id, track }) =>
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
  on(AlbumActions.saveTrackSuccess, (state, { id, track }) =>
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
  on(AlbumActions.getLyrics, (state, { id }) => {
    return adapter.updateOne({ id, changes: { gettingLyrics: true } }, state);
  }),
  on(AlbumActions.getLyricsSuccess, (state, { id, trackId, lyrics }) =>
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
  on(AlbumActions.getMaTracks, (state, { id }) => {
    return adapter.updateOne({ id, changes: { gettingMaTracks: true } }, state);
  }),
  on(AlbumActions.getMaTracksSuccess, (state, { id, maTracks }) =>
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
  on(AlbumActions.renameTrack, (state, { id, track }) =>
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
  on(AlbumActions.renameTrackSuccess, (state, { id, track }) =>
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
  on(AlbumActions.getBandProps, (state, { id }) => {
    return adapter.updateOne({ id, changes: { gettingBandProps: true } }, state);
  }),
  on(AlbumActions.getBandPropsSuccess, (state, { update }) => {
    return adapter.updateOne(update, state);
  })
);

export function reducer(state: AlbumState | undefined, action: Action) {
  return albumReducer(state, action);
}
