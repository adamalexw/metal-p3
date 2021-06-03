import { MetalArchivesAlbumTrack, Track } from '@metal-p3/api-interfaces';

export interface ApplyLyrics extends Track {
  maTrack?: MetalArchivesAlbumTrack;
}
