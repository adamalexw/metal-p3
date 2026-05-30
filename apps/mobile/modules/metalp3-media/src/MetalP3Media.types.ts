export interface Track {
  /** MediaStore _ID as string */
  id: string;
  /** content:// URI usable by audio players */
  uri: string;
  title: string | null;
  artist: string | null;
  album: string | null;
  albumArtist: string | null;
  genre: string | null;
  durationMs: number;
  year: number | null;
  trackNumber: number | null;
  discNumber: number | null;
  mimeType: string | null;
  sizeBytes: number;
}

export interface TrackTags {
  title: string | null;
  artist: string | null;
  album: string | null;
  albumArtist: string | null;
  genre: string | null;
  year: number | null;
  date: string | null;
  trackNumber: string | null;
  discNumber: string | null;
  composer: string | null;
  durationMs: number | null;
  bitrate: number | null;
  sampleRate: number | null;
  mimeType: string | null;
  hasArtwork: boolean;
}

export interface Artwork {
  base64: string;
  mimeType: string;
  byteLength: number;
}

export interface Lyrics {
  /** Plain (unsynchronized) lyrics text. */
  text: string;
  /** ISO-639-2 language code from the tag, when available. */
  language: string | null;
}

export interface ScanOptions {
  limit?: number;
  minDurationMs?: number;
}

export interface PermissionStatus {
  granted: boolean;
  permission: string;
}
