import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
      __store: store,
    },
  };
});

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockMedia = {
  audioPermission: 'android.permission.READ_MEDIA_AUDIO',
  getPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ granted: true, permission: 'android.permission.READ_MEDIA_AUDIO' }),
  scanAudioAsync: jest.fn(),
  searchAsync: jest.fn().mockResolvedValue([]),
  getTrackAsync: jest.fn().mockResolvedValue(null),
  getArtworkAsync: jest.fn().mockResolvedValue(null),
  getLyricsAsync: jest.fn().mockResolvedValue(null),
  deleteTracksAsync: jest.fn(),
};

const mockPlayer = {
  setQueueAsync: jest.fn().mockResolvedValue(undefined),
  addToQueueAsync: jest.fn().mockResolvedValue(undefined),
  playAsync: jest.fn().mockResolvedValue(undefined),
  pauseAsync: jest.fn().mockResolvedValue(undefined),
  stopAsync: jest.fn().mockResolvedValue(undefined),
  seekToAsync: jest.fn().mockResolvedValue(undefined),
  skipToNextAsync: jest.fn().mockResolvedValue(undefined),
  skipToPreviousAsync: jest.fn().mockResolvedValue(undefined),
  setRepeatModeAsync: jest.fn().mockResolvedValue(undefined),
  setShuffleAsync: jest.fn().mockResolvedValue(undefined),
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

const tracks = [
  {
    id: '1',
    uri: 'a://1',
    title: 'Hearts Alive',
    artist: 'Mastodon',
    album: 'Leviathan',
    albumArtist: 'Mastodon',
    genre: 'Sludge Metal',
    durationMs: 800_000,
    year: 2004,
    trackNumber: 7,
    discNumber: 1,
    mimeType: 'audio/mpeg',
    sizeBytes: 0,
  },
  {
    id: '2',
    uri: 'a://2',
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
];

mockMedia.scanAudioAsync.mockResolvedValue(tracks);

const LibraryScreen = require('../../app/(tabs)/index').default;

describe('LibraryScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockMedia.deleteTracksAsync.mockReset();
    mockPlayer.setQueueAsync.mockClear();
    mockPlayer.addToQueueAsync.mockClear();
    mockPlayer.playAsync.mockClear();
    mockPlayer.setShuffleAsync.mockClear();
  });

  it('renders one tile per album when scanned tracks share an album', async () => {
    const { getAllByText, queryAllByText } = render(<LibraryScreen />);

    await waitFor(() => {
      expect(getAllByText('Leviathan')).toHaveLength(1);
    });
    expect(queryAllByText('Mastodon')).toHaveLength(1);
  });

  it('renders the genre line on each tile when present', async () => {
    const { findAllByText } = render(<LibraryScreen />);

    const genreNodes = await findAllByText('Sludge Metal');
    expect(genreNodes.length).toBeGreaterThanOrEqual(1);
  });

  it('long-press on an album tile opens the context menu, and confirming Delete calls deleteTracksAsync with every track URI in the album', async () => {
    mockMedia.deleteTracksAsync.mockResolvedValueOnce({
      deletedUris: ['a://1', 'a://2'],
      failedUris: [],
    });

    const { findByText, getByTestId } = render(<LibraryScreen />);
    await findByText('Leviathan');

    const albumKey = 'mastodon|leviathan';
    fireEvent(getByTestId(`album-tile-${albumKey}`), 'longPress');
    fireEvent.press(getByTestId(`album-context-delete-${albumKey}`));
    await waitFor(() => expect(getByTestId('confirm-delete-sheet')).toBeTruthy());

    fireEvent.press(getByTestId('confirm-delete-confirm'));

    await waitFor(() => {
      expect(mockMedia.deleteTracksAsync).toHaveBeenCalledTimes(1);
    });
    const args = mockMedia.deleteTracksAsync.mock.calls[0][0] as string[];
    expect(args.sort()).toEqual(['a://1', 'a://2']);
  });

  it('Play album from the context menu queues the album, disables shuffle, and navigates to the player', async () => {
    const { findByText, getByTestId } = render(<LibraryScreen />);
    await findByText('Leviathan');

    const albumKey = 'mastodon|leviathan';
    fireEvent(getByTestId(`album-tile-${albumKey}`), 'longPress');
    fireEvent.press(getByTestId(`album-context-play-${albumKey}`));

    await waitFor(() => {
      expect(mockPlayer.setQueueAsync).toHaveBeenCalledTimes(1);
      expect(mockPlayer.playAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockPlayer.setShuffleAsync).toHaveBeenCalledWith(false);
    expect(mockPush).toHaveBeenCalledWith('/player');
  });

  it('Play album on shuffle from the context menu enables shuffle before playing', async () => {
    const { findByText, getByTestId } = render(<LibraryScreen />);
    await findByText('Leviathan');

    const albumKey = 'mastodon|leviathan';
    fireEvent(getByTestId(`album-tile-${albumKey}`), 'longPress');
    fireEvent.press(getByTestId(`album-context-shuffle-${albumKey}`));

    await waitFor(() => {
      expect(mockPlayer.setShuffleAsync).toHaveBeenCalledWith(true);
      expect(mockPlayer.setQueueAsync).toHaveBeenCalledTimes(1);
      expect(mockPlayer.playAsync).toHaveBeenCalledTimes(1);
    });
  });

  it('Add to queue from the context menu appends the album without restarting playback', async () => {
    const { findByText, getByTestId } = render(<LibraryScreen />);
    await findByText('Leviathan');

    const albumKey = 'mastodon|leviathan';
    fireEvent(getByTestId(`album-tile-${albumKey}`), 'longPress');
    fireEvent.press(getByTestId(`album-context-add-to-queue-${albumKey}`));

    await waitFor(() => {
      expect(mockPlayer.addToQueueAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockPlayer.setQueueAsync).not.toHaveBeenCalled();
    expect(mockPlayer.playAsync).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
