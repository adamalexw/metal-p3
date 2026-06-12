import { BASE_PATH } from '@metal-p3/album/domain';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { TrackService } from '@metal-p3/track/data-access';
import { SubscriberSpy, subscribeSpyTo } from '@hirez_io/observer-spy';
import { createServiceFactory, SpectatorService, SpyObject } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Action } from '@ngrx/store';
import { Observable, of, throwError } from 'rxjs';
import { TrackActions } from './actions';
import { TrackEffects } from './effects';

describe('TrackEffects getLocalLyrics$', () => {
  let spectator: SpectatorService<TrackEffects>;
  let actions$: Observable<Action>;
  let effectsSpy: SubscriberSpy<Action>;
  let trackService: SpyObject<TrackService>;

  const createService = createServiceFactory({
    service: TrackEffects,
    providers: [provideMockActions(() => actions$), provideMockStore(), { provide: BASE_PATH, useValue: '/music' }],
    mocks: [TrackService, ErrorService, NotificationService],
  });

  const baseAction = { id: 1, localTrackId: 7, artist: 'a', track: 't', album: 'al' };

  beforeEach(() => {
    spectator = createService();
    trackService = spectator.inject(TrackService);
  });

  it('prefers synced lyrics when present', () => {
    actions$ = of(TrackActions.getLocalLyrics(baseAction));
    trackService.getSyncedLyrics.mockReturnValue(of({ syncedLyrics: '[00:01.00] hi', plainLyrics: 'hi', instrumental: false }));

    effectsSpy = subscribeSpyTo(spectator.service.getLocalLyrics$);

    expect(effectsSpy.getFirstValue()).toEqual(TrackActions.getLocalLyricsSuccess({ id: 1, localTrackId: 7, syncedLyrics: '[00:01.00] hi', plainLyrics: 'hi' }));
  });

  it('falls back to plain lyrics when there are no synced lyrics', () => {
    actions$ = of(TrackActions.getLocalLyrics(baseAction));
    trackService.getSyncedLyrics.mockReturnValue(of({ syncedLyrics: null, plainLyrics: 'just words', instrumental: false }));

    effectsSpy = subscribeSpyTo(spectator.service.getLocalLyrics$);

    expect(effectsSpy.getFirstValue()).toEqual(TrackActions.getLocalLyricsSuccess({ id: 1, localTrackId: 7, syncedLyrics: null, plainLyrics: 'just words' }));
  });

  it('misses when the track is instrumental even if lyrics are returned', () => {
    actions$ = of(TrackActions.getLocalLyrics(baseAction));
    trackService.getSyncedLyrics.mockReturnValue(of({ syncedLyrics: '[00:01.00] hi', plainLyrics: 'hi', instrumental: true }));

    effectsSpy = subscribeSpyTo(spectator.service.getLocalLyrics$);

    expect(effectsSpy.getFirstValue()).toEqual(TrackActions.getLocalLyricsMiss({ id: 1, localTrackId: 7 }));
  });

  it('misses when nothing is found', () => {
    actions$ = of(TrackActions.getLocalLyrics(baseAction));
    trackService.getSyncedLyrics.mockReturnValue(of(null));

    effectsSpy = subscribeSpyTo(spectator.service.getLocalLyrics$);

    expect(effectsSpy.getFirstValue()).toEqual(TrackActions.getLocalLyricsMiss({ id: 1, localTrackId: 7 }));
  });

  it('misses on error', () => {
    actions$ = of(TrackActions.getLocalLyrics(baseAction));
    trackService.getSyncedLyrics.mockReturnValue(throwError(() => new Error('boom')));

    effectsSpy = subscribeSpyTo(spectator.service.getLocalLyrics$);

    expect(effectsSpy.getFirstValue()).toEqual(TrackActions.getLocalLyricsMiss({ id: 1, localTrackId: 7 }));
  });
});
