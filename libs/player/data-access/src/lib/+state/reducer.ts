import { PlaylistItem } from '@metal-p3/player/domain';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { addTracksToPlaylist, addTrackToPlaylist, playTrack, updatePlaylist } from './actions';

export const PLAYER_FEATURE_KEY = 'player';

export interface PlayerState extends EntityState<PlaylistItem> {
  activeTrack: string;
}

export const adapter: EntityAdapter<PlaylistItem> = createEntityAdapter<PlaylistItem>();

export const initialState = adapter.getInitialState({});

export const reducer = createReducer(
  initialState,
  on(addTrackToPlaylist, (state, { track }) => {
    return adapter.addOne(track, state);
  }),
  on(addTracksToPlaylist, (state, { tracks }) => {
    return adapter.addMany(tracks, state);
  }),
  on(updatePlaylist, (state, { updates }) => adapter.updateMany(updates, state)),
  on(playTrack, (state, { id }) => ({ ...state, activeTrack: id }))
);
