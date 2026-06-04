export type RepeatMode = 'off' | 'one' | 'all';

export interface QueueItem {
  id: string;
  uri: string;
  title?: string | null;
  artist?: string | null;
  album?: string | null;
  albumArtist?: string | null;
  artworkUri?: string | null;
  durationMs?: number | null;
}

export interface NowPlaying {
  id: string | null;
  uri: string | null;
  title: string | null;
  artist: string | null;
  album: string | null;
  albumArtist: string | null;
  artworkUri: string | null;
}

export interface ImportedPlaylistManifest {
  name: string;
  trackIds: string[];
}

export interface PlaybackState {
  ready: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  currentIndex: number;
  positionMs: number;
  durationMs: number;
  bufferedMs: number;
  playbackRate: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  current: NowPlaying | null;
  queue: QueueItem[];
}
