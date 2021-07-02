export interface LyricsHistoryDto {
  id: number;
  albumId: number;
  url: string;
  numTracks?: number;
  numLyrics?: number;
  numLyricsHistory?: number;
  checked?: boolean;
  folder: string;
  year?: number;
  complete?: boolean;
  error?: Error;
}
