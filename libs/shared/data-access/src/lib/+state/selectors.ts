import { createSelector } from '@ngrx/store';
import { selectAlbum, selectAlbumState } from './album/selectors';
import { selectCurrentRoute } from './router.selectors';
import { selectMaTracks, selectTrackCount, selectTracks } from './track/selectors';

export * from './album/selectors';
export * from './band/selectors';
export * from './cover/selectors';
export * from './router.selectors';
export * from './track/selectors';

export const selectAdvancedSearchOpen = createSelector(selectAlbumState, (album) => album.advancedSearchOpen);
export const selectSideNavOpen = createSelector(selectCurrentRoute, (route) => !!route?.routeConfig);

export const selectTrackSavingCount = createSelector(selectTracks, (tracks) => tracks?.filter((track) => track.trackSaving)?.length || 0);
export const selectAlbumSaving = createSelector(selectAlbum, selectTrackSavingCount, (album, tracks) => album?.saving || tracks > 0);
export const selectTrackSavingProgress = createSelector(selectTrackCount, selectTrackSavingCount, (total, progress) => getProgress(total || 0, progress));

export const selectTrackTransferringCount = createSelector(selectTracks, (tracks) => tracks?.filter((track) => track.trackTransferring)?.length || 0);
export const selectTrackTransferring = createSelector(selectTrackTransferringCount, (tracks) => tracks > 0);
export const selectTrackTransferringProgress = createSelector(selectTrackCount, selectTrackTransferringCount, (total, progress) => getProgress(total || 0, progress));

export const selectTrackRenamingCount = createSelector(selectTracks, (tracks) => tracks?.filter((track) => track.trackRenaming)?.length || 0);
export const selectTrackRenaming = createSelector(selectTrackRenamingCount, (tracks) => tracks > 0);
export const selectTrackRenamingProgress = createSelector(selectTrackCount, selectTrackRenamingCount, (total, progress) => getProgress(total || 0, progress));

export const selectLyricsLoadedCount = createSelector(selectMaTracks, (tracks) => tracks?.filter((track) => track.lyricsLoading)?.length || 0);
export const selectLyricsLoading = createSelector(selectLyricsLoadedCount, (tracks) => tracks > 0);
export const selectLyricsExpectedTotal = createSelector(selectMaTracks, (tracks) => tracks?.filter((track) => track.hasLyrics)?.length || 0);
export const selectLyricsLoadingProgress = createSelector(selectLyricsExpectedTotal, selectLyricsLoadedCount, (total, inFlight) => (total === 0 ? 0 : Math.floor(((total - inFlight) / total) * 100)));
export const selectLyricsExpected = createSelector(selectMaTracks, (tracks) => tracks?.some((track) => track.hasLyrics && track.lyrics == null && !track.lyricsLoading) ?? false);

const getProgress = (total: number, progress: number): number => {
  if (total === 0 || progress === 0) {
    return 0;
  }

  return Math.floor(((total - progress) / total) * 100);
};
