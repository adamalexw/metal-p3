import { Track } from '@metal-p3/track/domain';

type PlaylistTrack = Omit<Track, 'id'>;

export interface PlaylistItem extends PlaylistTrack {
  id: string;
  index: number;
  playing?: boolean;
  paused?: boolean;
  url?: string;
  albumId?: number;
  playlistItemId?: number;
}
