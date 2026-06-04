import { MetalArchivesAlbumTrack, TrackDto } from '@metal-p3/api-interfaces';

export type LyricsSource = 'synced' | 'plain';

export interface ApplyLyrics extends TrackDto {
  maTrack?: MetalArchivesAlbumTrack;
  selected?: boolean;
  lyricsSource?: LyricsSource | null;
}
