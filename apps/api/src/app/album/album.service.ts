import { AlbumDto } from '@metal-p3/api-interfaces';
import { Injectable } from '@nestjs/common';
import { Album, Band, Prisma } from '@prisma/client';
import { Tags } from 'node-id3';
import * as path from 'path';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DbService } from '../shared/db.service';
import { FileSystemService } from '../shared/file-system.service';
import { TrackService } from '../track/track.service';

@Injectable()
export class AlbumService {
  constructor(private readonly dbService: DbService, private readonly fileSystemService: FileSystemService, private readonly trackService: TrackService) {}

  getAlbums(request: { skip?: number; take?: number; criteria?: string }): Observable<AlbumDto[]> {
    let where: Prisma.AlbumWhereInput;

    if (request.criteria) {
      where = {
        Folder: { contains: request.criteria },
      };
    }

    return from(this.dbService.albums({ skip: request.skip, take: request.take, where, orderBy: { Created: 'desc' } })).pipe(map((albums) => albums.map((album) => this.mapAlbumToAlbumDto(album))));
  }

  getAlbum(id: number): Observable<AlbumDto> {
    return from(this.dbService.album({ AlbumId: +id })).pipe(map((album) => this.mapAlbumToAlbumDto(album)));
  }

  private mapAlbumToAlbumDto(album: Album): AlbumDto {
    const band = album['Band'] as Band;

    return {
      id: album.AlbumId,
      fullPath: path.join(environment.basePath, album.Folder),
      folder: album.Folder,
      bandId: band.BandId,
      artist: band.Name,
      album: album.Name,
      year: album.Year,
      genre: band.Genre,
      country: band.Country,
      albumUrl: album.MetalArchiveUrl,
      artistUrl: band.MetalArchiveUrl,
      transferred: album.Transferred,
      hasLyrics: album.Lyrics,
    };
  }

  async addAlbum(folder: string): Promise<AlbumDto> {
    const files = this.fileSystemService.getFiles(folder);

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      if (path.extname(file) == '.mp3') {
        const tags = this.trackService.getTags(path.join(folder, file));

        if (tags.artist) {
          const bands = await this.dbService.bands({ Name: tags.artist });
          let band: Band;

          if (!bands?.length) {
            band = await this.dbService.createBand({ Name: tags.artist });
          } else {
            band = bands && bands[0];
          }

          const data = this.mapTagsToAlbum(path.basename(folder), tags, band);
          const newAlbum = await this.dbService.createAlbum(data);

          return this.mapAlbumToAlbumDto(newAlbum);
        }

        break;
      }
    }
  }

  private mapTagsToAlbum(folder: string, tags: Tags, band: Band): Prisma.AlbumCreateInput {
    const bandInput: Prisma.BandCreateNestedOneWithoutAlbumInput = {
      connect: { BandId: band.BandId },
    };

    const lyrics = !!tags.unsynchronisedLyrics?.text;

    const input: Prisma.AlbumCreateInput = {
      Folder: folder,
      Name: tags.album,
      Year: tags.year && +tags.year,
      Transferred: false,
      Lyrics: lyrics,
      LyricsDate: lyrics ? new Date() : null,
      Band: bandInput,
    };

    return input;
  }

  async saveAlbum(album: AlbumDto): Promise<void> {
    this.dbService.updateAlbum({ where: { AlbumId: album.id }, data: this.mapAlbumDtoToAlbum(album) });
  }

  private mapAlbumDtoToAlbum(albumDto: AlbumDto): Partial<Album> {
    return {
      Folder: albumDto.folder,
      Lyrics: albumDto.hasLyrics,
      MetalArchiveUrl: albumDto.albumUrl,
      Name: albumDto.album,
      Transferred: albumDto.transferred,
    };
  }
}
