import { SubscriberSpy, subscribeSpyTo } from '@hirez_io/observer-spy';
import { LyricsHistoryDto, UrlMatcher } from '@metal-p3/maintenance/domain';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { createServiceFactory, SpectatorService, SpyObject } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { Observable, of, throwError } from 'rxjs';
import { LyricsMaintenanceService } from '../lyrics.service';
import { UrlMaintenanceService } from '../url.service';
import { MaintenanceActions } from './actions';
import { MaintenanceEffects } from './effects';

describe('MaintenanceEffects', () => {
  let spectator: SpectatorService<MaintenanceEffects>;
  let actions$: Observable<Action>;
  let effectsSpy: SubscriberSpy<Action>;
  let errorService: SpyObject<ErrorService>;

  const createService = createServiceFactory({
    service: MaintenanceEffects,
    providers: [provideMockActions(() => actions$)],
    mocks: [LyricsMaintenanceService, UrlMaintenanceService, ErrorService, NotificationService],
  });

  beforeEach(() => {
    spectator = createService();
    errorService = spectator.inject(ErrorService);
  });

  describe('Lyrics', () => {
    let lyricsMaintenanceService: SpyObject<LyricsMaintenanceService>;
    let notificationService: SpyObject<NotificationService>;

    const history: LyricsHistoryDto = {
      id: 1,
      albumId: 1,
      url: 'url',
      folder: 'folder',
    };

    beforeEach(() => {
      lyricsMaintenanceService = spectator.inject(LyricsMaintenanceService);
      notificationService = spectator.inject(NotificationService);
    });

    describe('addLyricsPriority$', () => {
      it('should show complete notification', () => {
        const albumId = 1;

        actions$ = of(MaintenanceActions.addLyricsPriority({ albumId }));
        lyricsMaintenanceService.addPriority.mockReturnValue(of(history));

        const nonDispatchEffectsSpy = subscribeSpyTo(spectator.service.addLyricsPriority$);
        nonDispatchEffectsSpy.getFirstValue();

        expect(notificationService.showComplete).toHaveBeenCalledWith('Lyrics Priority Added');
      });

      it('should show error notification', () => {
        const albumId = 1;
        actions$ = of(MaintenanceActions.addLyricsPriority({ albumId }));
        lyricsMaintenanceService.addPriority.mockReturnValue(throwError(() => new Error('Error')));

        const nonDispatchEffectsSpy = subscribeSpyTo(spectator.service.addLyricsPriority$);
        nonDispatchEffectsSpy.getFirstValue();

        expect(notificationService.showError).toHaveBeenCalledWith(undefined, 'Lyrics Priority Error');
      });
    });

    describe('getLyricsHistory$', () => {
      it('should return getLyricsHistorySuccess action and call getPriority', () => {
        actions$ = of(MaintenanceActions.getLyricsHistory({ priority: true }));
        lyricsMaintenanceService.getPriority.mockReturnValue(of([history]));

        effectsSpy = subscribeSpyTo(spectator.service.getLyricsHistory$);

        expect(effectsSpy.getFirstValue()).toEqual(MaintenanceActions.getLyricsHistorySuccess({ history: [history] }));
        expect(lyricsMaintenanceService.getPriority).toBeCalled();
      });

      it('should return getLyricsHistorySuccess action and call getHistory', () => {
        const history: LyricsHistoryDto[] = [
          {
            id: 1,
            albumId: 1,
            url: 'url',
            folder: 'folder',
          },
        ];

        actions$ = of(MaintenanceActions.getLyricsHistory({ priority: false }));
        lyricsMaintenanceService.getHistory.mockReturnValue(of(history));

        effectsSpy = subscribeSpyTo(spectator.service.getLyricsHistory$);

        expect(effectsSpy.getFirstValue()).toEqual(MaintenanceActions.getLyricsHistorySuccess({ history }));
        expect(lyricsMaintenanceService.getHistory).toBeCalled();
      });

      it('should return getLyricsHistoryError action on error', () => {
        const error = 'Error';

        actions$ = of(MaintenanceActions.getLyricsHistory({ priority: false }));
        errorService.getError.mockReturnValue(error);

        effectsSpy = subscribeSpyTo(spectator.service.getLyricsHistory$);

        expect(effectsSpy.getFirstValue()).toEqual(MaintenanceActions.getLyricsHistoryError({ error }));
      });
    });

    describe('checkLyricsHistory$', () => {
      it('should return checkLyricsHistorySuccess and call checkPriority', () => {
        actions$ = of(MaintenanceActions.checkLyricsHistory({ priority: true }));
        lyricsMaintenanceService.checkPriority.mockReturnValue(of([history]));

        effectsSpy = subscribeSpyTo(spectator.service.checkLyricsHistory$);

        expect(effectsSpy.getFirstValue()).toEqual(MaintenanceActions.checkLyricsHistorySuccess());
        expect(lyricsMaintenanceService.checkPriority).toBeCalled();
      });

      it('should return checkLyricsHistorySuccess action and call checkHistory', () => {
        actions$ = of(MaintenanceActions.checkLyricsHistory({ priority: false }));
        lyricsMaintenanceService.checkHistory.mockReturnValue(of([history]));

        effectsSpy = subscribeSpyTo(spectator.service.checkLyricsHistory$);

        expect(effectsSpy.getFirstValue()).toEqual(MaintenanceActions.checkLyricsHistorySuccess());
        expect(lyricsMaintenanceService.checkHistory).toBeCalled();
      });

      it('should return checkLyricsHistoryError action on error', () => {
        const error = 'Error';

        actions$ = of(MaintenanceActions.checkLyricsHistory({ priority: false }));
        errorService.getError.mockReturnValue(error);

        effectsSpy = subscribeSpyTo(spectator.service.checkLyricsHistory$);

        expect(effectsSpy.getFirstValue()).toEqual(MaintenanceActions.checkLyricsHistoryError({ error }));
      });
    });

    describe('checkedLyricsHistory$', () => {
      it('should return checkedLyricsHistorySuccess action', () => {
        const id = 1;
        const checked = true;

        actions$ = of(MaintenanceActions.checkedLyricsHistory({ id, checked }));
        lyricsMaintenanceService.checkedLyricsHistory.mockReturnValue(of(history));

        effectsSpy = subscribeSpyTo(spectator.service.checkedLyricsHistory$);

        expect(lyricsMaintenanceService.checkedLyricsHistory).toBeCalled();
        expect(effectsSpy.getFirstValue()).toEqual(MaintenanceActions.checkedLyricsHistorySuccess({ update: { id, changes: { checked } } }));
      });

      it('should return checkedLyricsHistoryError action and show error notification', () => {
        const id = 1;
        const checked = true;

        actions$ = of(MaintenanceActions.checkedLyricsHistory({ id, checked }));
        lyricsMaintenanceService.checkedLyricsHistory.mockReturnValue(throwError(() => new Error('Error')));

        effectsSpy = subscribeSpyTo(spectator.service.checkedLyricsHistory$);

        expect(lyricsMaintenanceService.checkedLyricsHistory).toBeCalled();
        expect(notificationService.showError).toHaveBeenCalledWith(undefined, 'Checked Lyrics History Error');
        expect(effectsSpy.getFirstValue()).toEqual(MaintenanceActions.checkedLyricsHistoryError({ id, error: expect.anything() }));
      });
    });

    describe('deleteLyricsHistory$', () => {
      it('should return deleteLyricsHistorySuccess action', () => {
        const id = 1;

        actions$ = of(MaintenanceActions.deleteLyricsHistory({ id }));
        lyricsMaintenanceService.deleteLyricsHistory.mockReturnValue(of(true));

        effectsSpy = subscribeSpyTo(spectator.service.deleteLyricsHistory$);

        expect(lyricsMaintenanceService.deleteLyricsHistory).toBeCalled();
        expect(effectsSpy.getFirstValue()).toEqual(MaintenanceActions.deleteLyricsHistorySuccess({ id }));
      });

      it('should return deleteLyricsHistoryError action and show error notification', () => {
        const id = 1;

        actions$ = of(MaintenanceActions.deleteLyricsHistory({ id }));
        lyricsMaintenanceService.deleteLyricsHistory.mockReturnValue(throwError(() => new Error('Error')));

        effectsSpy = subscribeSpyTo(spectator.service.deleteLyricsHistory$);

        expect(lyricsMaintenanceService.deleteLyricsHistory).toBeCalled();
        expect(notificationService.showError).toHaveBeenCalledWith(undefined, 'Delete Lyrics History Error');
        expect(effectsSpy.getFirstValue()).toEqual(MaintenanceActions.deleteLyricsHistoryError({ id, error: expect.anything() }));
      });
    });

    describe('stopLyricsCheck$', () => {
      it('should call cancelHistoryCheck on the lyricsService', () => {
        actions$ = of(MaintenanceActions.stopLyricsHistoryCheck());

        const nonDispatchEffectsSpy = subscribeSpyTo(spectator.service.stopLyricsHistoryCheck$);
        nonDispatchEffectsSpy.getFirstValue();

        expect(lyricsMaintenanceService.cancelHistoryCheck).toBeCalled();
      });
    });
  });

  describe('Url Matcher', () => {
    let urlMaintenanceService: SpyObject<UrlMaintenanceService>;

    beforeEach(() => {
      urlMaintenanceService = spectator.inject(UrlMaintenanceService);
    });

    describe('getUrlMatcher$', () => {
      it('should return getUrlMatcherSuccess action', () => {
        const albums: UrlMatcher[] = [
          {
            id: 1,
            bandId: 2,
            band: 'band',
            album: 'album',
          },
          {
            id: 2,
            bandId: 3,
            band: 'band1',
            album: 'album1',
          },
        ];

        actions$ = of(MaintenanceActions.getUrlMatcher());
        urlMaintenanceService.list.mockReturnValue(of(albums));

        effectsSpy = subscribeSpyTo(spectator.service.getUrlMatcher$);

        expect(urlMaintenanceService.list).toHaveBeenCalled();
        expect(effectsSpy.getFirstValue()).toEqual(MaintenanceActions.getUrlMatcherSuccess({ albums }));
      });
    });

    it('should return getUrlMatcherError action', () => {
      const error = 'Error';
      actions$ = of(MaintenanceActions.getUrlMatcher());
      urlMaintenanceService.list.mockReturnValue(throwError(() => new Error('Error')));
      errorService.getError.mockReturnValue(error);

      effectsSpy = subscribeSpyTo(spectator.service.getUrlMatcher$);

      expect(urlMaintenanceService.list).toHaveBeenCalled();
      expect(effectsSpy.getFirstValue()).toEqual(MaintenanceActions.getUrlMatcherError({ error }));
    });

    describe('startUrlMatcher$', () => {
      it('should call match on the urlMaintenanceService', () => {
        actions$ = of(MaintenanceActions.startUrlMatcher());

        const nonDispatchEffectsSpy = subscribeSpyTo(spectator.service.startUrlMatcher$);
        nonDispatchEffectsSpy.getFirstValue();

        expect(urlMaintenanceService.match).toBeCalled();
      });
    });

    describe('stopUrlMatcher$', () => {
      it('should call cancel on the urlMaintenanceService', () => {
        actions$ = of(MaintenanceActions.stopUrlMatcher());

        const nonDispatchEffectsSpy = subscribeSpyTo(spectator.service.stopUrlMatcher$);
        nonDispatchEffectsSpy.getFirstValue();

        expect(urlMaintenanceService.cancel).toBeCalled();
      });
    });
  });
});
