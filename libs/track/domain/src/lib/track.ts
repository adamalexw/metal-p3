import { FormControl, FormGroup } from '@angular/forms';
import { TrackDto } from '@metal-p3/api-interfaces';

export interface Track extends TrackDto {
  trackSaving?: boolean;
  trackRenaming?: boolean;
  trackTransferring?: boolean;
  trackDeleting?: boolean;
  trackDeletionError?: string;
  playlistItemId?: number;
}

export const tracksFormArray = new FormGroup({
  id: new FormControl<number>(0, { nonNullable: true }),
  trackNumber: new FormControl<string>('0', { nonNullable: true }),
  title: new FormControl<string>('0', { nonNullable: true }),
  duration: new FormControl<number | undefined>(undefined, { nonNullable: true }),
  bitrate: new FormControl<number | undefined>(undefined, { nonNullable: true }),
  lyrics: new FormControl<string | undefined>(undefined, { nonNullable: true }),
  file: new FormControl<string>('', { nonNullable: true }),
  folder: new FormControl<string>('', { nonNullable: true }),
  fullPath: new FormControl<string>('', { nonNullable: true }),
});
