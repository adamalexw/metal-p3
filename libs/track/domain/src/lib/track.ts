import { FormControl } from '@angular/forms';
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
}

export type TracksForm = {
  id: FormControl<number>;
  trackNumber: FormControl<string>;
  title: FormControl<string>;
  duration: FormControl<number | undefined>;
  bitrate: FormControl<number | undefined>;
  lyrics: FormControl<string | undefined>;
  file: FormControl<string>;
  folder: FormControl<string>;
  fullPath: FormControl<string>;
};
