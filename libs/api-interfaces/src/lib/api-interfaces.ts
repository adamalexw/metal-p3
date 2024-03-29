export interface SearchRequest {
  take?: number;
  skip?: number;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  country?: string;
  transferred?: boolean;
  hasLyrics?: boolean;
  folder?: string;
  cancel?: boolean;
  exactMatch?: boolean;
}

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
  dateCreated: string;
  extraFiles?: boolean;
}

export interface TrackBase {
  id: number;
  fullPath: string;
  folder: string;
  file: string;
  trackNumber: string;
  title: string;
  bitrate?: number;
  duration?: number;
  lyrics?: string;
}

export interface TrackDto extends TrackBase, AlbumBase {}

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
  aaData: {
    0: string;
    1: string;
    2: string;
  }[];
  results: MetalArchivesSearchResponseItem[];
}

export type MetalArchivesReleaseType = 'Full-length' | 'Live album' | 'Demo' | 'Single' | 'EP' | 'Video' | 'Boxed set' | 'Split' | 'Compilation' | 'Split video' | 'Collaboration';

export interface MetalArchivesSearchResponseItem {
  artistUrl: string;
  albumUrl: string;
  releaseType: MetalArchivesReleaseType | string;
}

export interface MetalArchivesUrl {
  artistUrl?: string;
  albumUrl?: string;
  ignore?: boolean;
}

export interface MetalArchivesAlbumTrack {
  id: string;
  trackNumber?: string;
  title?: string;
  duration?: string;
  hasLyrics?: boolean;
  lyrics?: string;
  lyricsLoading?: boolean;
}

export interface RenameFolder {
  fullPath: string;
  folder: string;
}

export interface RenameTrack {
  fullPath: string;
  file: string;
}

export const ALBUM_ADDED = 'albumAdded';
export const LYRICS_HISTORY_UPDATE = 'lyricsHistoryUpdate';
export const LYRICS_HISTORY_COMPLETE = 'lyricsHistoryComplete';
export const EXTRA_FILES = 'extraFiles';
export const EXTRA_FILES_COMPLETE = 'extraFilesComplete';
export const URL_MATCHER = 'urlMatcher';
export const URL_MATCHER_COMPLETE = 'urlMatcherComplete';
