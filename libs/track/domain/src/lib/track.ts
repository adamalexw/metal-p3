import { TrackDto } from '@metal-p3/api-interfaces';

export interface Track extends TrackDto {
  trackSaving?: boolean;
  trackRenaming?: boolean;
  trackTransferring?: boolean;
  trackDeleting?: boolean;
  trackDeletionError?: string;
  playlistItemId?: number;
}
