import { PlaylistDto } from '@metal-p3/player/domain';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { createPlaylistSuccess, deletePlaylistSuccess, loadPlaylist, loadPlaylists, loadPlaylistsError, loadPlaylistsSuccess } from './actions';

export const PLAYLIST_FEATURE_KEY = 'playlist';

export interface PlaylistState extends EntityState<PlaylistDto> {
  loaded: boolean;
  loading: boolean;
  loadError?: string;
  active?: number;
}

export const adapter: EntityAdapter<PlaylistDto> = createEntityAdapter<PlaylistDto>({});

export const initialState = adapter.getInitialState({
  loaded: false,
  loading: false,
});

export const reducer = createReducer(
  initialState,
  on(loadPlaylists, (state) => ({ ...state, loading: true })),
  on(loadPlaylistsSuccess, (state, { playlists }) => adapter.setAll(playlists, { ...state, loading: false, loaded: true })),
  on(loadPlaylistsError, (state, { error }) => ({ ...state, loading: false, loaded: false, loadError: error })),
  on(createPlaylistSuccess, (state, { playlist }) => adapter.addOne(playlist, { ...state, active: playlist.id })),
  on(loadPlaylist, (state, { id }) => ({ ...state, active: id })),
  on(deletePlaylistSuccess, (state, { id }) => adapter.removeOne(id, { ...state, active: undefined }))
);
