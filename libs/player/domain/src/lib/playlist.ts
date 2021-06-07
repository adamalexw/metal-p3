import { Track } from '@metal-p3/api-interfaces';

type PlaylistTrack = Omit<Track, 'id'>;

export interface PlaylistItem extends PlaylistTrack {
  id: string;
  playing?: boolean;
  paused?: boolean;
  url?: string;
  albumId?: number;
}
