import { FormControl } from '@angular/forms';
import { TrackDto } from '@metal-p3/api-interfaces';

export interface Track extends TrackDto {
  trackSaving?: boolean;
  trackRenaming?: boolean;
  trackTransferring?: boolean;
  trackDeleting?: boolean;
  trackDeletionError?: string;
  playlistItemId?: number;
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
