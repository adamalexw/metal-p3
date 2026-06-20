import { AlbumDto } from '@metal-p3/api-interfaces';

export interface Album extends AlbumDto {
  getError?: string;
  findingUrl?: boolean;
  saving?: boolean;
  saveError?: string;
  renamingFolder?: boolean;
  renamingFolderError?: string;
  refreshing?: boolean;
  gettingMaTracks?: boolean;
  deleting?: boolean;
  deleteError?: string;
}

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
    played: dto.played,
    year: dto.year,
    dateCreated: dto.dateCreated,
  };
};
