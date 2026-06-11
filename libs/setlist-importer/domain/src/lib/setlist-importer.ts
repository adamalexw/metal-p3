export interface ImportedTrack {
  title: string;
  hintedAlbum?: string;
  songPageUrl?: string;
}

export interface ImportedSetlist {
  id: string;
  url: string;
  artist: string;
  date?: string;
  venue?: string;
  tracks: ImportedTrack[];
  error?: string;
}

export interface ResolvedTrackMatch {
  albumId: number;
  albumName: string;
  folder: string;
  fullPath: string;
  score: number;
}

export type ResolvedTrackStatus = 'matched' | 'missing';

export interface ResolvedTrack {
  key: string;
  artist: string;
  title: string;
  hintedAlbum?: string;
  status: ResolvedTrackStatus;
  match?: ResolvedTrackMatch;
  selected: boolean;
}

export interface ScrapeSetlistsRequest {
  urls: string[];
}

export interface MatchTracksRequest {
  setlists: ImportedSetlist[];
}
