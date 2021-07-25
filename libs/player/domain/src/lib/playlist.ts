import { Track } from '@metal-p3/api-interfaces';

export interface PlaylistDto {
  id: number;
  name: string;
  items: PlaylistItemDto[];
}

export interface PlaylistItemDto {
  id: number;
  playlistId: number;
  itemPath: string;
}

type PlaylistTrack = Omit<Track, 'id'>;

export interface PlaylistItem extends PlaylistTrack {
  id: string;
  index: number;
  playing?: boolean;
  paused?: boolean;
  url?: string;
  albumId?: number;
}
