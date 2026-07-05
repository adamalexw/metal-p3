import { renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';

const mockMedia = {
  audioPermission: 'android.permission.READ_MEDIA_AUDIO',
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, permission: '' }),
  scanAudioAsync: jest.fn().mockResolvedValue([]),
  searchAsync: jest.fn().mockResolvedValue([]),
  getTrackAsync: jest.fn().mockResolvedValue(null),
  getArtworkAsync: jest.fn().mockResolvedValue(null),
  getLyricsAsync: jest.fn().mockResolvedValue(null),
  getExtrasAsync: jest.fn().mockResolvedValue(null),
  deleteTracksAsync: jest.fn(),
  deleteAlbumFolderAsync: jest.fn(),
  addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
};

const mockPlayer = {
  getStateAsync: jest.fn().mockResolvedValue({
    ready: false, isPlaying: false, isLoading: false, currentIndex: -1,
    positionMs: 0, durationMs: 0, bufferedMs: 0, playbackRate: 1,
    repeatMode: 'off', shuffle: false, current: null, queue: [],
  }),
  addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
};

jest.mock('expo-modules-core', () => ({
  requireNativeModule: (name: string) => (name === 'MetalP3Player' ? mockPlayer : mockMedia),
}));

jest.mock('react-native-image-colors', () => ({
  getColors: jest.fn(),
}));

// require() after the mocks — ES imports would hoist above the mockMedia/
// mockPlayer declarations and the expo-modules-core factory would see undefined.
const { getColors } = require('react-native-image-colors');
const { startArtworkPrefetcher } = require('../lib/artwork-prefetcher');
const {
  _resetForTests: resetArtworkCache,
  getCachedTrackArtwork,
  loadTrackArtwork,
  revalidateNullArtwork,
  subscribeArtwork,
} = require('../lib/useTrackArtwork');
const {
  _resetForTests: resetThemeCache,
  useArtworkTheme,
} = require('../theme/useArtworkTheme');

const mockGetColors = getColors as jest.Mock;

const ANDROID_PALETTE = {
  platform: 'android',
  dominant: '#223344',
  darkMuted: '#112233',
  darkVibrant: '#331122',
  lightVibrant: '#eeddcc',
  lightMuted: '#ccccdd',
  vibrant: '#cc3355',
  muted: '#556677',
};

beforeEach(() => {
  jest.clearAllMocks();
  resetArtworkCache();
  resetThemeCache();
  mockGetColors.mockResolvedValue(ANDROID_PALETTE);
});

describe('revalidateNullArtwork', () => {
  it('clears a null-poisoned entry, notifies listeners, and allows a re-fetch', async () => {
    mockMedia.getArtworkAsync.mockResolvedValueOnce(null);
    await loadTrackArtwork('content://track/1');
    expect(getCachedTrackArtwork('content://track/1')).toBeNull();

    const listener = jest.fn();
    const unsubscribe = subscribeArtwork(listener);

    mockMedia.getArtworkAsync.mockResolvedValue({
      fileUri: 'file:///art/1.jpg', mimeType: 'image/jpeg', byteLength: 3,
    });
    expect(revalidateNullArtwork('content://track/1')).toBe(true);
    expect(listener).toHaveBeenCalledWith('content://track/1');

    await loadTrackArtwork('content://track/1');
    expect(getCachedTrackArtwork('content://track/1')).toBe('file:///art/1.jpg');
    unsubscribe();
  });

  it('is a no-op when the cache holds real artwork or has no entry', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeArtwork(listener);

    expect(revalidateNullArtwork('content://track/unknown')).toBe(false);

    mockMedia.getArtworkAsync.mockResolvedValue({
      fileUri: 'file:///art/2.jpg', mimeType: 'image/jpeg', byteLength: 3,
    });
    await loadTrackArtwork('content://track/2');
    expect(revalidateNullArtwork('content://track/2')).toBe(false);
    expect(getCachedTrackArtwork('content://track/2')).toBe('file:///art/2.jpg');
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe('useArtworkTheme fallback', () => {
  it('keeps the artwork when palette extraction fails instead of reverting to the default theme', async () => {
    mockMedia.getArtworkAsync.mockResolvedValue({
      fileUri: 'file:///art/3.jpg', mimeType: 'image/jpeg', byteLength: 3,
    });
    mockGetColors.mockRejectedValue(new Error('palette failed'));

    const { result } = renderHook(() => useArtworkTheme('content://track/3'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.artworkDataUri).toBe('file:///art/3.jpg');
    });
  });
});

describe('foreground revalidation', () => {
  it('repairs artwork that failed to load while the device was locked', async () => {
    const appStateSpy = jest.spyOn(AppState, 'addEventListener');
    const uri = 'content://track/4';
    mockPlayer.getStateAsync.mockResolvedValue({
      ready: true, isPlaying: true, isLoading: false, currentIndex: 0,
      positionMs: 0, durationMs: 1000, bufferedMs: 0, playbackRate: 1,
      repeatMode: 'off', shuffle: false,
      current: { uri, title: 'T' }, queue: [{ uri, title: 'T' }],
    });
    // Locked: the native read resolves null and poisons the cache.
    mockMedia.getArtworkAsync.mockResolvedValueOnce(null);

    startArtworkPrefetcher();
    await waitFor(() => expect(mockMedia.getArtworkAsync).toHaveBeenCalledTimes(1));
    expect(getCachedTrackArtwork(uri)).toBeNull();

    // Unlocked: the read succeeds again.
    mockMedia.getArtworkAsync.mockResolvedValue({
      fileUri: 'file:///art/4.jpg', mimeType: 'image/jpeg', byteLength: 3,
    });
    const handlers = appStateSpy.mock.calls
      .filter(([event]) => event === 'change')
      .map(([, handler]) => handler);
    expect(handlers.length).toBeGreaterThan(0);
    handlers.forEach((handler) => handler('active'));

    await waitFor(() => {
      expect(getCachedTrackArtwork(uri)).toBe('file:///art/4.jpg');
    });
  });
});
