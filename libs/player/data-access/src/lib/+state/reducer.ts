import { PlaylistItem } from '@metal-p3/player/domain';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { PlayerActions } from './actions';

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
  visible: false,
  footerMode: true,
});

export const reducer = createReducer(
  initialState,
  on(PlayerActions.show, (state): PlayerState => ({ ...state, visible: true, footerMode: false })),
  on(PlayerActions.close, (state) => adapter.removeAll({ ...state, visible: false })),
  on(PlayerActions.toogleView, (state): PlayerState => ({ ...state, footerMode: !state.footerMode })),
  on(PlayerActions.addItem, (state, { track }) => adapter.addOne(track, state)),
  on(PlayerActions.addItems, (state, { tracks }) => adapter.addMany(tracks, state)),
  on(PlayerActions.updateItems, PlayerActions.reorder, PlayerActions.shuffleSuccess, (state, { updates }) => adapter.updateMany(updates, state)),
  on(PlayerActions.updateItem, PlayerActions.getCoverSuccess, PlayerActions.getCoverError, (state, { update }) => adapter.updateOne(update, state)),
  on(PlayerActions.play, (state, { id }): PlayerState => ({ ...state, activeTrack: id })),
  on(PlayerActions.removeSuccess, (state, { id }) => adapter.removeOne(id, state)),
  on(PlayerActions.clearSuccess, (state) => adapter.removeAll({ ...state, activeTrack: undefined }))
);
