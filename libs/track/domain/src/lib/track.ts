import { TrackDto } from '@metal-p3/api-interfaces';

export type TrackLyricsSource = 'synced' | 'plain';

export interface Track extends TrackDto {
  trackSaving?: boolean;
  trackSavingError?: string;
  trackRenaming?: boolean;
  trackRenamingError?: string;
  trackTransferring?: boolean;
  trackDeleting?: boolean;
  trackDeletionError?: string;
  playlistItemId?: number;
  lyricsSource?: TrackLyricsSource | null;
  lyricsLoading?: boolean;
  lyricsChecked?: boolean;
}

export type TracksForm = Pick<Track, 'id' | 'trackNumber' | 'title' | 'duration' | 'bitrate' | 'file' | 'folder' | 'fullPath'> & {
  lyrics: string;
  syncedLyrics: string;
};
