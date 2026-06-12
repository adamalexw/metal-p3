import { TracksForm } from '@metal-p3/track/domain';

export interface AlbumForm {
  details: AlbumDetailsForm;
  tracks: TracksForm[];
}

export interface AlbumDetailsForm {
  artist: string;
  album: string;
  year: number;
  genre: string;
  country: string;
  played: boolean;
  artistUrl: string;
  albumUrl: string;
  ignore: boolean;
  transferred: boolean;
  hasLyrics: boolean;
  dateCreated: string;
}
