export interface AlbumBase extends MetalArchivesUrl {
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  country?: string;
  cover?: string;
}

export interface AlbumDto extends AlbumBase {
  id: number;
  fullPath: string;
  folder: string;
  bandId: number;
  transferred?: boolean;
  hasLyrics?: boolean;
}

export interface Track extends AlbumBase {
  id: number;
  fullPath?: string;
  folder?: string;
  file?: string;
  trackNumber?: string;
  title?: string;
  bitrate?: number;
  duration?: number;
  lyrics?: string;
  trackSaving?: boolean;
}

export interface BandDto extends BandProps {
  id: number;
  name: string;
  metalArchiveUrl?: string;
}

export interface BandProps {
  genre?: string;
  country?: string;
}

export interface MetalArchivesSearchResponse {
  error?: unknown;
  iTotalRecords: number;
  iTotalDisplayRecords?: number;
  aaData: string[][];
}

export interface MetalArchivesUrl {
  artistUrl?: string;
  albumUrl?: string;
}

export interface MetalArchivesAlbumTrack {
  id: number;
  trackNumber?: string;
  title?: string;
  duration?: string;
  hasLyrics?: boolean;
  lyrics?: string;
}
