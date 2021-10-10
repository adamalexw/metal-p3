import { API, BASE_PATH, SearchRequest } from '@metal-p3/album/domain';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { Socket } from 'ngx-socket-io';
import { AlbumService } from './album.service';

describe('AlbumService', () => {
  let spectator: SpectatorHttp<AlbumService>;
  const createService = createHttpFactory({
    service: AlbumService,
    providers: [{ provide: API, useValue: 'api/' }, { provide: BASE_PATH, useValue: 'd:/mp3' }, mockProvider(Socket)],
  });

  beforeEach(() => (spectator = createService()));

  describe('Get Albums', () => {
    it('should use default params', () => {
      const request: Partial<SearchRequest> = {};

      spectator.service.getAlbums(request).subscribe();
      spectator.expectOne('api/album/search?take=25&skip=0', HttpMethod.GET);
    });

    it('should use provided with params', () => {
      const request: Partial<SearchRequest> = {
        criteria: 'kreator',
        take: 5,
        skip: 2,
      };

      spectator.service.getAlbums(request).subscribe();
      spectator.expectOne('api/album/search?take=5&skip=2&criteria=kreator', HttpMethod.GET);
    });

    it('should encode criteria param', () => {
      const request: Partial<SearchRequest> = {
        criteria: 'in flames',
      };

      spectator.service.getAlbums(request).subscribe();
      spectator.expectOne('api/album/search?take=25&skip=0&criteria=in%20flames', HttpMethod.GET);
    });
  });
});
