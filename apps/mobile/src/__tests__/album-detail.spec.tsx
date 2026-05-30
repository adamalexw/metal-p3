import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PlaybackState } from '../../modules/metalp3-player';
import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockParams: { current: { key: string } } = { current: { key: 'mastodon|leviathan' } };

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => mockParams.current,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

jest.mock('../theme/useArtworkTheme', () => ({
  useArtworkTheme: () => ({
    background: '#101010',
    surface: '#202020',
    foreground: '#ffffff',
    mutedForeground: '#bbbbbb',
    accent: '#ff0066',
    accentForeground: '#000000',
    artworkDataUri: null,
    loading: false,
  }),
}));

const mockPlayer = {
  setQueueAsync: jest.fn().mockResolvedValue(undefined),
  playAsync: jest.fn().mockResolvedValue(undefined),
  pauseAsync: jest.fn().mockResolvedValue(undefined),
  stopAsync: jest.fn().mockResolvedValue(undefined),
  seekToAsync: jest.fn().mockResolvedValue(undefined),
  skipToNextAsync: jest.fn().mockResolvedValue(undefined),
  skipToPreviousAsync: jest.fn().mockResolvedValue(undefined),
  setRepeatModeAsync: jest.fn().mockResolvedValue(undefined),
  setShuffleAsync: jest.fn().mockResolvedValue(undefined),
  getStateAsync: jest.fn(),
  addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
};

const mockMedia = {
  audioPermission: 'android.permission.READ_MEDIA_AUDIO',
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, permission: '' }),
  scanAudioAsync: jest.fn().mockResolvedValue([]),
  searchAsync: jest.fn().mockResolvedValue([]),
  getTrackAsync: jest.fn().mockResolvedValue(null),
  getArtworkAsync: jest.fn().mockResolvedValue(null),
  getLyricsAsync: jest.fn().mockResolvedValue(null),
};

jest.mock('expo-modules-core', () => ({
  requireNativeModule: (name: string) => (name === 'MetalP3Player' ? mockPlayer : mockMedia),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
    multiGet: jest.fn().mockResolvedValue([]),
    multiSet: jest.fn().mockResolvedValue(undefined),
    multiRemove: jest.fn().mockResolvedValue(undefined),
    getAllKeys: jest.fn().mockResolvedValue([]),
  },
}));

const tracks: Track[] = [
  {
    id: 'track-1',
    uri: 'a://1',
    title: 'Blood and Thunder',
    artist: 'Mastodon',
    album: 'Leviathan',
    albumArtist: 'Mastodon',
    genre: 'Sludge Metal',
    durationMs: 230_000,
    year: 2004,
    trackNumber: 1,
    discNumber: 1,
    mimeType: 'audio/mpeg',
    sizeBytes: 0,
  },
  {
    id: 'track-2',
    uri: 'a://2',
    title: 'Iron Tusk',
    artist: 'Mastodon',
    album: 'Leviathan',
    albumArtist: 'Mastodon',
    genre: 'Sludge Metal',
    durationMs: 175_000,
    year: 2004,
    trackNumber: 2,
    discNumber: 1,
    mimeType: 'audio/mpeg',
    sizeBytes: 0,
  },
];

const idleState: PlaybackState = {
  ready: false,
  isPlaying: false,
  isLoading: false,
  currentIndex: -1,
  positionMs: 0,
  durationMs: 0,
  bufferedMs: 0,
  playbackRate: 1,
  repeatMode: 'off',
  shuffle: false,
  current: null,
};

const playingTrack2State: PlaybackState = {
  ready: true,
  isPlaying: true,
  isLoading: false,
  currentIndex: 1,
  positionMs: 1000,
  durationMs: 175_000,
  bufferedMs: 1000,
  playbackRate: 1,
  repeatMode: 'off',
  shuffle: false,
  current: {
    id: 'track-2',
    uri: 'a://2',
    title: 'Iron Tusk',
    artist: 'Mastodon',
    album: 'Leviathan',
    albumArtist: 'Mastodon',
    artworkUri: null,
  },
};

function noop(): void {
  /* intentional no-op */
}

const { setLibraryTracks, clearLibraryCache } = require('../lib/library-cache');
const AlbumDetailScreen = require('../../app/album/[key]').default;

describe('AlbumDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearLibraryCache();
    setLibraryTracks(tracks);
    mockParams.current = { key: 'mastodon|leviathan' };
    mockPlayer.getStateAsync.mockResolvedValue(idleState);
    mockPlayer.addListener.mockReturnValue({ remove: jest.fn() });
  });

  it('tapping a track row enqueues the album, plays, then navigates to /(tabs)/player', async () => {
    const { findByTestId } = render(<AlbumDetailScreen />);
    const row = await findByTestId('album-track-track-2');

    fireEvent.press(row);

    await waitFor(() => {
      expect(mockPlayer.setQueueAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockPlayer.playAsync).toHaveBeenCalledTimes(1);

    const setQueueOrder = mockPlayer.setQueueAsync.mock.invocationCallOrder[0];
    const playOrder = mockPlayer.playAsync.mock.invocationCallOrder[0];
    expect(setQueueOrder).toBeLessThan(playOrder);

    const setQueueArgs = mockPlayer.setQueueAsync.mock.calls[0];
    expect(setQueueArgs[1]).toBe(1);
    expect(setQueueArgs[2]).toBe(0);
    expect(Array.isArray(setQueueArgs[0])).toBe(true);
    expect(setQueueArgs[0]).toHaveLength(2);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/player');
    });
  });

  it('does not navigate when setQueueAsync rejects', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(noop);
    mockPlayer.setQueueAsync.mockRejectedValueOnce(new Error('boom'));

    const { findByTestId } = render(<AlbumDetailScreen />);
    fireEvent.press(await findByTestId('album-track-track-1'));

    await waitFor(() => {
      expect(mockPlayer.setQueueAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockPlayer.playAsync).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('renders a playing-indicator only on the row whose id matches now-playing', async () => {
    mockPlayer.getStateAsync.mockResolvedValue(playingTrack2State);

    const { findByTestId, queryByTestId } = render(<AlbumDetailScreen />);

    await findByTestId('album-track-playing-indicator-track-2');
    expect(queryByTestId('album-track-playing-indicator-track-1')).toBeNull();
  });

  it('renders no playing-indicator when nothing is playing', async () => {
    const { findByTestId, queryByTestId } = render(<AlbumDetailScreen />);

    await findByTestId('album-track-track-1');
    expect(queryByTestId('album-track-playing-indicator-track-1')).toBeNull();
    expect(queryByTestId('album-track-playing-indicator-track-2')).toBeNull();
  });
});
