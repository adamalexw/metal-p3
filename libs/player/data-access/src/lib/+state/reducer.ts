import { PlaylistItem } from '@metal-p3/player/domain';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  addTracksToPlaylist,
  addTrackToPlaylist,
  clearPlaylist,
  closePlayer,
  getItemCoverError,
  getItemCoverSuccess,
  playItem,
  removeItemSuccess,
  reorderPlaylist,
  showPlayer,
  tooglePlayerView,
  updatePlaylist,
  updatePlaylistItem,
} from './actions';

export const PLAYER_FEATURE_KEY = 'player';

export interface PlayerState extends EntityState<PlaylistItem> {
  visible: boolean;
  footerMode: boolean;
  activeTrack?: string;
  activePlaylist?: number;
}

function sortByIndex(a: PlaylistItem, b: PlaylistItem): number {
  return a.index - b.index;
}

export const adapter: EntityAdapter<PlaylistItem> = createEntityAdapter<PlaylistItem>({
  sortComparer: sortByIndex,
});

export const initialState = adapter.getInitialState({
  footerMode: true,
  selectPlaylist: false,
});

export const reducer = createReducer(
  initialState,
  on(showPlayer, (state) => ({ ...state, visible: true, footerMode: false })),
  on(closePlayer, (state) => adapter.removeAll({ ...state, visible: false })),
  on(tooglePlayerView, (state) => ({ ...state, footerMode: !state.footerMode })),
  on(addTrackToPlaylist, (state, { track }) => adapter.addOne(track, state)),
  on(addTracksToPlaylist, (state, { tracks }) => adapter.addMany(tracks, state)),
  on(updatePlaylist, reorderPlaylist, (state, { updates }) => adapter.updateMany(updates, state)),
  on(updatePlaylistItem, getItemCoverSuccess, getItemCoverError, (state, { update }) => adapter.updateOne(update, state)),
  on(playItem, (state, { id }) => ({ ...state, activeTrack: id })),
  on(removeItemSuccess, (state, { id }) => adapter.removeOne(id, state)),
  on(clearPlaylist, (state) => adapter.removeAll({ ...state, activeTrack: undefined }))
);
