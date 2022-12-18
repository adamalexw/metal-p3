import { AlbumDto, BandProps, MetalArchivesAlbumTrack } from '@metal-p3/api-interfaces';
import { Track } from '@metal-p3/track/domain';
import { EntityState } from '@ngrx/entity';

export interface Album extends AlbumDto {
  getError?: string;
  bandProps?: BandProps;
  gettingBandProps?: boolean;
  tracks: EntityState<Track>;
  tracksLoading?: boolean;
  tracksError?: string;
  coverLoading?: boolean;
  coverError?: string;
  findingUrl?: boolean;
  saving?: boolean;
  saveError?: string;
  savingCover?: boolean;
  renamingFolder?: boolean;
  renamingFolderError?: string;
  refreshing?: boolean;
  gettingMaTracks?: boolean;
  maTracks: EntityState<MetalArchivesAlbumTrack>;
  deleting?: boolean;
  deleteError?: string;
}

export type AlbumWithoutTracks = Omit<Album, 'tracks' | 'maTracks'>;

export const AlbumDtoToAlbum = (dto: AlbumDto): Partial<Album> => {
  return {
    bandId: dto.bandId,
    folder: dto.folder,
    fullPath: dto.fullPath,
    id: dto.id,
    album: dto.album,
    albumUrl: dto.albumUrl,
    artist: dto.artist,
    artistUrl: dto.artistUrl,
    ignore: dto.ignore,
    country: dto.country,
    cover: dto.cover,
    genre: dto.genre,
    hasLyrics: dto.hasLyrics,
    transferred: dto.transferred,
    year: dto.year,
    dateCreated: dto.dateCreated,
  };
};
