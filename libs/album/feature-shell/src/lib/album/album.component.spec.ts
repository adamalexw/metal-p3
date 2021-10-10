import { RouterTestingModule } from '@angular/router/testing';
import { AlbumService } from '@metal-p3/album/data-access';
import { AlbumComponent } from '@metal-p3/album/ui';
import { CoverService } from '@metal-p3/cover/data-access';
import { PlayerService } from '@metal-p3/player/data-access';
import { Album, selectAlbum, selectRouteParams } from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { AlbumShellComponent } from './album.component';

describe('AlbumShellComponent', () => {
  let spectator: Spectator<AlbumShellComponent>;
  let store: MockStore;
  let dispatcher: jest.SpyInstance<void, [action: Action]>;

  const album: Album = {
    id: 123,
    fullPath: 'path',
    folder: 'folder',
    bandId: 1,
    dateCreated: '',
    album: 'album',
    tracks: {
      ids: [],
      entities: {},
    },
    maTracks: {
      ids: [],
      entities: {},
    },
  };

  const initialState = {
    router: {},
    albums: {
      ids: [1],
      entities: {
        '1': {
          ...album,
        },
      },
      loading: false,
      loaded: true,
    },
  };

  const createComponent = createComponentFactory({
    component: AlbumShellComponent,
    imports: [RouterTestingModule],
    declarations: [MockComponent(AlbumComponent)],
    providers: [provideMockStore({ initialState }), mockProvider(AlbumService), mockProvider(CoverService), mockProvider(NotificationService), mockProvider(PlayerService)],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    store = spectator.inject(MockStore);
    dispatcher = jest.spyOn(store, 'dispatch');
  });

  it('should get album from route id', () => {
    selectRouteParams.setResult({
      params: {
        id: 123,
      },
    });

    store.refreshState();
    spectator.detectChanges();

    // const selectedAlbumSpy = subscribeSpyTo(store.select(selectedAlbum));

    // expect(selectedAlbumSpy.getLastValue()).toBe(123);
    expect(dispatcher).toBeCalled();
  });

  it('should get album from route id', () => {
    selectAlbum.setResult({
      id: 123,
      fullPath: 'path',
      folder: 'folder',
      bandId: 1,
      dateCreated: '',
      album: 'album',
      tracks: {
        ids: [1],
        entities: {},
      },
      maTracks: {
        ids: [1],
        entities: {},
      },
    });

    //store.refreshState();
    //spectator.detectChanges();

    // const selectedAlbumSpy = subscribeSpyTo(store.select(selectedAlbum));

    // expect(selectedAlbumSpy.getLastValue()).toBe(123);
    expect(dispatcher).toBeCalled();
  });
});
