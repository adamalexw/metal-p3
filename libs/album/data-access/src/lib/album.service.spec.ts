import { API, BASE_PATH, TAKE } from '@metal-p3/album/domain';
import { SearchRequest } from '@metal-p3/api-interfaces';
import { HttpMethod, SpectatorHttp, createHttpFactory, mockProvider } from '@ngneat/spectator/jest';
import { Socket } from 'ngx-socket-io';
import { AlbumService } from './album.service';

describe('AlbumService', () => {
  let spectator: SpectatorHttp<AlbumService>;
  const createService = createHttpFactory({
    service: AlbumService,
    providers: [{ provide: API, useValue: 'api/' }, { provide: BASE_PATH, useValue: 'd:/mp3' }, { provide: TAKE, useValue: 10 }, mockProvider(Socket)],
  });

  beforeEach(() => (spectator = createService()));

  describe('Get Albums', () => {
    it('should use default params', () => {
      const request: SearchRequest = {};

      spectator.service.getAlbums(request).subscribe();
      spectator.expectOne('api/album/search?take=25&skip=0', HttpMethod.GET);
    });

    it('should use provided with params', () => {
      const request: SearchRequest = {
        folder: 'kreator',
        take: 5,
        skip: 2,
      };

      spectator.service.getAlbums(request).subscribe();
      spectator.expectOne('api/album/search?folder=kreator&take=5&skip=2', HttpMethod.GET);
    });

    it('should encode folder param', () => {
      const request: SearchRequest = {
        folder: 'in flames',
      };

      spectator.service.getAlbums(request).subscribe();
      spectator.expectOne('api/album/search?folder=in%20flames&take=25&skip=0', HttpMethod.GET);
    });
  });
});
