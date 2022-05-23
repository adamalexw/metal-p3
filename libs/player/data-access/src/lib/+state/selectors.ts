import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adapter, PlayerState, PLAYER_FEATURE_KEY } from './reducer';

export const selectPlaylistState = createFeatureSelector<PlayerState>(PLAYER_FEATURE_KEY);

const { selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const selectFooterMode = createSelector(selectPlaylistState, (state) => state.footerMode);

export const selectPlaylistEntities = createSelector(selectPlaylistState, selectEntities);
export const selectPlaylist = createSelector(selectPlaylistState, (state) => selectAll(state));
export const selectPlaylistItemSize = createSelector(selectPlaylistState, (state) => selectTotal(state));
export const selectShowPlayer = createSelector(selectPlaylistItemSize, (size) => !!size);

export const selectPlayerVisible = createSelector(selectPlaylistState, (state) => state.visible);
export const selectPlayerOpen = createSelector(selectPlaylist, selectPlayerVisible, (playlist, visible) => !!playlist?.length || visible);

export const selectActiveItemId = createSelector(selectPlaylistState, (state) => state.activeTrack);
export const selectActivePlaylistItem = createSelector(selectPlaylistEntities, selectActiveItemId, (playlist, id) => (playlist && id ? playlist[id] : undefined));
export const selectActiveItemCover = createSelector(selectActivePlaylistItem, (item) => item?.cover);

export const selectActiveItemIndex = createSelector(selectPlaylist, selectActiveItemId, (playlist, item) => playlist && playlist.findIndex((pl) => pl.id === item));
export const selectFirstItemPlaying = createSelector(selectActiveItemIndex, (index) => index === 0);
export const selectLastItemPlaying = createSelector(selectActiveItemIndex, selectPlaylist, (index, playlist) => index === playlist.length - 1);

export const selectPlaylistDuration = createSelector(selectPlaylist, (playlist) => playlist?.map((track) => track.duration || 0)?.reduce((accumulator, current) => (accumulator += current), 0));

export const selectPlaylistCovers = createSelector(selectPlaylist, (playlist) => playlist?.map((track) => track.cover));
export const selectPlaylistUrls = createSelector(selectPlaylist, (playlist) => playlist?.map((track) => track.url));
export const selectPlaylistBlobs = createSelector(selectPlaylistCovers, selectPlaylistUrls, (covers, urls) => covers.concat(urls));

export const selectItemById = (id: string) => createSelector(selectPlaylist, (playlist) => playlist.find((item) => item.id === id));
