import { PlaylistItem } from '@metal-p3/player/domain';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { addTracksToPlaylist, addTrackToPlaylist, clearPlaylist, playItem, reorderPlaylist, tooglePlayerView, updatePlaylist, updatePlaylistItem } from './actions';

export const PLAYER_FEATURE_KEY = 'player';

export interface PlayerState extends EntityState<PlaylistItem> {
  activeTrack?: string;
  footerMode: boolean;
}

function sortByIndex(a: PlaylistItem, b: PlaylistItem): number {
  return a.index - b.index;
}

export const adapter: EntityAdapter<PlaylistItem> = createEntityAdapter<PlaylistItem>({
  sortComparer: sortByIndex
});

export const initialState = adapter.getInitialState({
  footerMode: true,
});

export const reducer = createReducer(
  initialState,
  on(tooglePlayerView, (state) => ({ ...state, footerMode: !state.footerMode })),
  on(addTrackToPlaylist, (state, { track }) => adapter.addOne(track, state)),
  on(addTracksToPlaylist, (state, { tracks }) => adapter.addMany(tracks, state)),
  on(updatePlaylist, reorderPlaylist, (state, { updates }) => adapter.updateMany(updates, state)),
  on(updatePlaylistItem, (state, { update }) => adapter.updateOne(update, state)),
  on(playItem, (state, { id }) => ({ ...state, activeTrack: id })),
  on(clearPlaylist, (state) => adapter.removeAll(state))
);
