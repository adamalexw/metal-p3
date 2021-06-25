export interface LyricsHistoryDto {
  lyricsHistoryId: number;
  albumId: number;
  url: string;
  numTracks?: number;
  numLyrics?: number;
  numLyricsHistory?: number;
  folder: string;
}
