import { HttpErrorResponse } from '@angular/common/http';
import { MetalArchivesAlbumTrack, SearchRequest } from '@metal-p3/api-interfaces';
import { Track } from '@metal-p3/track/domain';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { AlbumActions, BandActions, CoverActions, TrackActions } from './actions';
import { Album } from './model';

export const ALBUMS_FEATURE_KEY = 'albums';

export interface AlbumState extends EntityState<Album> {
  loading: boolean;
  loaded: boolean;
  loadError?: string;
  advancedSearchOpen: boolean;
  searchRequest: SearchRequest;
  error?: HttpErrorResponse | Error;
  creatingNew?: boolean;
  selectedAlbumId?: number;
  tracks: EntityState<Track>;
  maTracks: EntityState<MetalArchivesAlbumTrack>;
}

function sortByDateCreated(a: Album, b: Album): number {
  return b.dateCreated.localeCompare(a.dateCreated);
}

export const albumAdapter: EntityAdapter<Album> = createEntityAdapter<Album>({
  sortComparer: sortByDateCreated,
});
export const trackAdapter: EntityAdapter<Track> = createEntityAdapter<Track>();
export const maTrackAdapter: EntityAdapter<MetalArchivesAlbumTrack> = createEntityAdapter<MetalArchivesAlbumTrack>();

const initalSearchRequest: SearchRequest = { skip: 60, take: 0 };

export const initialState = albumAdapter.getInitialState({
  loading: false,
  loaded: false,
  advancedSearchOpen: false,
  searchRequest: initalSearchRequest,
  tracks: trackAdapter.getInitialState(),
  maTracks: maTrackAdapter.getInitialState(),
});

export const reducer = createReducer(
  initialState,
  on(AlbumActions.advancedSearch, (state): AlbumState => ({ ...state, advancedSearchOpen: !state.advancedSearchOpen })),
  on(AlbumActions.addAlbum, (state, { album }) => albumAdapter.addOne(album, { ...state, getAlbumError: undefined })),
  on(AlbumActions.setAlbum, (state, { album }) => albumAdapter.setOne(album, state)),
  on(AlbumActions.upsertAlbum, (state, { album }) => albumAdapter.upsertOne(album, state)),
  on(AlbumActions.upsertAlbums, (state, { albums }) => albumAdapter.upsertMany(albums, state)),
  on(AlbumActions.updateAlbum, (state, { update }) => albumAdapter.updateOne(update, state)),
  on(AlbumActions.updateAlbums, (state, { updates }) => albumAdapter.updateMany(updates, state)),
  on(AlbumActions.mapAlbum, (state, { entityMap }) => albumAdapter.mapOne(entityMap, state)),
  on(AlbumActions.mapAlbums, (state, { entityMap }) => albumAdapter.map(entityMap, state)),
  on(AlbumActions.deleteAlbum, (state, { id }) => albumAdapter.updateOne({ id, changes: { deleting: true, deleteError: undefined } }, state)),
  on(AlbumActions.deleteAlbumSuccess, (state, { id }) => albumAdapter.removeOne(id, state)),
  on(AlbumActions.deleteAlbumError, (state, { id, error }) => albumAdapter.updateOne({ id, changes: { deleting: false, deleteError: error } }, state)),
  on(AlbumActions.deleteAlbums, (state, { ids }) => albumAdapter.removeMany(ids, state)),
  on(AlbumActions.deleteAlbumsByPredicate, (state, { predicate }) => albumAdapter.removeMany(predicate, state)),
  on(AlbumActions.loadAlbums, (state, { request }): AlbumState => ({ ...state, searchRequest: request, loading: true, loaded: false })),
  on(AlbumActions.loadAlbumsSuccess, (state, { albums }) => albumAdapter.setAll(albums, { ...state, loading: false, loaded: true, loadError: undefined })),
  on(AlbumActions.loadAlbumsPageSuccess, (state, { albums }) => albumAdapter.addMany(albums, { ...state, loading: false, loaded: true, loadError: undefined })),
  on(AlbumActions.loadAlbumsError, (state, { loadError }): AlbumState => ({ ...state, loading: false, loaded: false, loadError })),
  on(AlbumActions.clearAlbums, (state) => albumAdapter.removeAll({ ...state, selectedAlbumId: null })),
  on(AlbumActions.viewAlbum, (state, { id }): AlbumState => ({ ...state, selectedAlbumId: id })),
  on(AlbumActions.findMetalArchivesUrl, (state, { id }) => albumAdapter.updateOne({ id, changes: { findingUrl: true } }, state)),
  on(AlbumActions.findMetalArchivesUrlSuccess, (state, { update }) => albumAdapter.updateOne(update, state)),
  on(AlbumActions.saveAlbum, (state, { album }) => albumAdapter.updateOne({ id: album.id, changes: { saving: true } }, state)),
  on(AlbumActions.saveAlbumSuccess, AlbumActions.saveAlbumError, (state, { update }) => albumAdapter.updateOne(update, state)),
  on(AlbumActions.createNew, (state): AlbumState => ({ ...state, creatingNew: true })),
  on(AlbumActions.createNewSuccess, (state): AlbumState => ({ ...state, creatingNew: false })),
  on(AlbumActions.renameFolder, (state, { id }) => albumAdapter.updateOne({ id, changes: { renamingFolder: true, renamingFolderError: undefined } }, state)),
  on(AlbumActions.renameFolderSuccess, AlbumActions.renameFolderError, AlbumActions.setExtraFiles, (state, { update }) => albumAdapter.updateOne(update, state)),

  /** COVER */
  on(CoverActions.get, (state, { id }) => albumAdapter.updateOne({ id, changes: { coverLoading: true } }, state)),
  on(CoverActions.getSuccess, CoverActions.getError, (state, { update }) => albumAdapter.updateOne(update, state)),
  on(CoverActions.getMany, (state, { request }) =>
    albumAdapter.updateMany(
      request.requests.map((r) => ({ id: r.id, changes: { coverLoading: true } })),
      state
    )
  ),
  on(CoverActions.getManySuccess, (state, { update }) => albumAdapter.updateMany(update, state)),
  on(CoverActions.save, (state, { id }) => albumAdapter.updateOne({ id: id, changes: { savingCover: true } }, state)),
  on(CoverActions.saveSuccess, CoverActions.downloadSuccess, (state, { update }) => albumAdapter.updateOne(update, state)),

  /** TRACK */
  on(TrackActions.getTracks, (state, { id }) => albumAdapter.updateOne({ id, changes: { tracksLoading: true } }, state)),
  on(TrackActions.getTracksSuccess, (state, { id, tracks }) =>
    albumAdapter.updateOne(
      {
        id,
        changes: {
          tracks: trackAdapter.setAll(tracks, state.tracks),
          tracksLoading: false,
        },
      },
      state
    )
  ),
  on(TrackActions.saveTrack, (state, { id, track }) =>
    albumAdapter.mapOne(
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
  on(TrackActions.saveTrackSuccess, (state, { id, track }) =>
    albumAdapter.mapOne(
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
  on(TrackActions.getLyrics, (state, { id, trackId }) =>
    albumAdapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          maTracks: maTrackAdapter.updateOne({ id: trackId, changes: { lyricsLoading: true } }, album.maTracks),
        }),
      },
      state
    )
  ),
  on(TrackActions.getLyricsSuccess, (state, { id, trackId, lyrics }) =>
    albumAdapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          maTracks: maTrackAdapter.map((track) => (track.id === trackId ? { ...track, lyrics, lyricsLoading: false } : track), album.maTracks),
        }),
      },
      state
    )
  ),
  on(TrackActions.getLyricsError, (state, { id, trackId, error }) =>
    albumAdapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          maTracks: maTrackAdapter.map((track) => (track.id === trackId ? { ...track, error, lyricsLoading: false } : track), album.maTracks),
        }),
      },
      state
    )
  ),
  on(TrackActions.getMetalArchivesTracks, (state, { id }) => albumAdapter.updateOne({ id, changes: { gettingMaTracks: true } }, state)),
  on(TrackActions.getMetalArchivesTracksSuccess, (state, { id, maTracks }) =>
    albumAdapter.updateOne(
      {
        id,
        changes: {
          maTracks: maTrackAdapter.setAll(maTracks, state.maTracks),
          gettingMaTracks: false,
        },
      },
      state
    )
  ),
  on(TrackActions.renameTrack, (state, { id, track }) =>
    albumAdapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          tracks: trackAdapter.updateOne({ id: track.id, changes: { trackRenaming: true } }, album.tracks),
        }),
      },
      state
    )
  ),
  on(TrackActions.renameTrackSuccess, (state, { id, trackId, file, fullPath }) =>
    albumAdapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          tracks: trackAdapter.updateOne({ id: trackId, changes: { file, fullPath, trackRenaming: false } }, album.tracks),
        }),
      },
      state
    )
  ),
  on(TrackActions.updateTracksSuccess, (state, { id, updates }) =>
    albumAdapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          tracks: trackAdapter.updateMany(updates, album.tracks),
        }),
      },
      state
    )
  ),
  on(TrackActions.transferTrack, (state, { id, trackId }) =>
    albumAdapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          tracks: trackAdapter.updateOne({ id: trackId, changes: { trackTransferring: true } }, album.tracks),
        }),
      },
      state
    )
  ),
  on(TrackActions.transferTrackSuccess, (state, { id, track }) =>
    albumAdapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          tracks: trackAdapter.updateOne({ id: track.id, changes: { trackTransferring: false } }, album.tracks),
        }),
      },
      state
    )
  ),
  on(TrackActions.deleteTrack, (state, { id, track }) =>
    albumAdapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          tracks: trackAdapter.updateOne({ id: track.id, changes: { trackDeleting: true, trackDeletionError: undefined } }, album.tracks),
        }),
      },
      state
    )
  ),
  on(TrackActions.deleteTrackSuccess, (state, { id, track }) =>
    albumAdapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          tracks: trackAdapter.removeOne(track.id, album.tracks),
        }),
      },
      state
    )
  ),
  on(TrackActions.deleteTrackError, (state, { id, trackId, error }) =>
    albumAdapter.mapOne(
      {
        id,
        map: (album) => ({
          ...album,
          tracks: trackAdapter.updateOne({ id: trackId, changes: { trackDeleting: false, trackDeletionError: error } }, album.tracks),
        }),
      },
      state
    )
  ),

  /** BAND */
  on(BandActions.getProps, (state, { id }) => {
    return albumAdapter.updateOne({ id, changes: { gettingBandProps: true } }, state);
  }),
  on(BandActions.getPropsSuccess, (state, { update }) => {
    return albumAdapter.updateOne(update, state);
  })
);
