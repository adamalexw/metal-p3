import { PlayerActions } from '@metal-p3/player/data-access';
import { PlaylistDto } from '@metal-p3/playlist/domain';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { PlaylistActions } from './actions';

export const PLAYLIST_FEATURE_KEY = 'playlist';

export interface PlaylistState extends EntityState<PlaylistDto> {
  loaded: boolean;
  loading: boolean;
  loadError: string | undefined;
  active: number | undefined;
  transferring: boolean;
}

export const adapter: EntityAdapter<PlaylistDto> = createEntityAdapter<PlaylistDto>({});

const initialState: PlaylistState = adapter.getInitialState({
  loaded: false,
  loading: false,
  loadError: undefined,
  active: undefined,
  transferring: false,
});

export const playlistFeature = {
  name: PLAYLIST_FEATURE_KEY,
  reducer: createReducer(
    initialState,
    on(PlaylistActions.loadPlaylists, (state): PlaylistState => ({ ...state, loading: true })),
    on(PlaylistActions.loadPlaylistsSuccess, (state, { playlists }): PlaylistState => adapter.setAll(playlists, { ...state, loading: false, loaded: true })),
    on(PlaylistActions.loadPlaylistsError, (state, { error }): PlaylistState => ({ ...state, loading: false, loaded: false, loadError: error })),
    on(PlaylistActions.createSuccess, (state, { playlist }) => adapter.addOne(playlist, { ...state, active: playlist.id })),
    on(PlaylistActions.loadPlaylistSuccess, (state, { id }): PlaylistState => ({ ...state, active: id })),
    on(PlaylistActions.saveSuccess, (state, { playlist }) => adapter.updateOne({ id: playlist.id, changes: { ...playlist } }, state)),
    on(PlaylistActions.deleteSuccess, (state, { id }) => adapter.removeOne(id, { ...state, active: undefined })),
    on(PlaylistActions.transfer, (state): PlaylistState => ({ ...state, transferring: true })),
    on(PlaylistActions.transferComplete, (state): PlaylistState => ({ ...state, transferring: false })),
    on(PlayerActions.clear, (state): PlaylistState => ({ ...state, active: undefined })),
  ),
};
