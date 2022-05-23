import { PlayerActions } from '@metal-p3/player/data-access';
import { PlaylistDto } from '@metal-p3/playlist/domain';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { PlaylistActions } from './actions';

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
  on(PlaylistActions.loadPlaylists, (state): PlaylistState => ({ ...state, loading: true })),
  on(PlaylistActions.loadPlaylistsSuccess, (state, { playlists }): PlaylistState => adapter.setAll(playlists, { ...state, loading: false, loaded: true })),
  on(PlaylistActions.loadPlaylistsError, (state, { error }): PlaylistState => ({ ...state, loading: false, loaded: false, loadError: error })),
  on(PlaylistActions.createSuccess, (state, { playlist }) => adapter.addOne(playlist, { ...state, active: playlist.id })),
  on(PlaylistActions.loadPlaylistSuccess, (state, { id }): PlaylistState => ({ ...state, active: id })),
  on(PlaylistActions.saveSuccess, (state, { playlist }) => adapter.updateOne({ id: playlist.id, changes: { ...playlist } }, state)),
  on(PlaylistActions.deleteSuccess, (state, { id }) => adapter.removeOne(id, { ...state, active: undefined })),
  on(PlayerActions.clear, (state): PlaylistState => ({ ...state, active: undefined }))
);
