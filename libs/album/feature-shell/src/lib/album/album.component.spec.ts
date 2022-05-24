import { RouterTestingModule } from '@angular/router/testing';
import { AlbumService } from '@metal-p3/album/data-access';
import { AlbumComponent } from '@metal-p3/album/ui';
import { CoverService } from '@metal-p3/cover/data-access';
import { PlayerService } from '@metal-p3/player/data-access';
import {
  Album,
  AlbumActions,
  CoverActions,
  selectAlbum,
  selectAlbumsLoaded,
  selectCoverLoading,
  selectCoverRequired,
  selectRouteId,
  selectSaveAlbumError,
  selectSelectedAlbumId,
  selectTracksLoading,
  selectTracksRequired,
  TrackActions,
} from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
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
    fullPath: 'fullPath',
    folder: 'folder',
    bandId: 234,
    dateCreated: new Date().toISOString(),
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
    albums: {},
  };

  const createComponent = createComponentFactory({
    component: AlbumShellComponent,
    imports: [RouterTestingModule],
    declarations: [MockComponent(AlbumComponent)],
    providers: [provideMockStore({ initialState })],
    mocks: [AlbumService, CoverService, NotificationService, PlayerService],
  });

  beforeEach(() => {
    spectator = createComponent();
    store = spectator.inject(MockStore);
    dispatcher = jest.spyOn(store, 'dispatch');
  });

  afterEach(() => store?.resetSelectors());

  it('should dispatch AlbumActions.viewAlbum action with route id', () => {
    const routeId = 123;
    selectSelectedAlbumId.setResult(undefined);
    selectRouteId.setResult(routeId.toString());
    selectAlbumsLoaded.setResult(false);
    selectTracksRequired.setResult(false);
    selectCoverRequired.setResult(false);

    store.refreshState();

    expect(dispatcher).toHaveBeenCalled();
    expect(dispatcher).toHaveBeenCalledWith(AlbumActions.viewAlbum({ id: routeId }));
  });

  it('should dispatch AlbumActions.getAlbum action when selected album is not in the list', () => {
    const id = 123;
    selectAlbumsLoaded.setResult(true);
    selectAlbum.setResult();
    selectSelectedAlbumId.setResult(id);

    store.refreshState();

    expect(dispatcher).toBeCalledWith(AlbumActions.getAlbum({ id }));
  });

  it('should dispatch TrackActions.getTracks action when tracks have not yet been loaded', () => {
    selectAlbum.setResult(album);
    selectTracksLoading.setResult(false);
    selectTracksRequired.setResult(true);
    selectCoverRequired.setResult(false);

    store.refreshState();

    expect(dispatcher).toHaveBeenCalledWith(expect.objectContaining(TrackActions.getTracks({ id: album.id, folder: album.folder })));
  });

  it('should dispatch CoverActions.get action when cover has not been loaded', () => {
    selectAlbum.setResult(album);
    selectCoverLoading.setResult(false);
    selectCoverRequired.setResult(true);
    selectTracksRequired.setResult(false);

    store.refreshState();

    expect(dispatcher).toHaveBeenCalledWith(expect.objectContaining(CoverActions.get({ id: album.id, folder: album.folder })));
  });

  it('should dispatch AlbumActions.getExtraFiles', () => {
    selectAlbum.setResult(album);
    selectTracksRequired.setResult(false);
    selectCoverRequired.setResult(false);

    store.refreshState();

    expect(dispatcher).toHaveBeenCalledWith(expect.objectContaining(AlbumActions.getExtraFiles({ id: album.id, folder: album.folder })));
  });

  it('should show notification error', () => {
    selectSaveAlbumError.setResult('Error');

    store.refreshState();

    expect(spectator.inject(NotificationService).showError).toHaveBeenCalled();
  });
});
