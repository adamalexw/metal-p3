import { MetalArchivesAlbumTrack, TrackDto } from '@metal-p3/api-interfaces';

export interface ApplyLyrics extends TrackDto {
  maTrack?: MetalArchivesAlbumTrack;
  selected?: boolean;
}
