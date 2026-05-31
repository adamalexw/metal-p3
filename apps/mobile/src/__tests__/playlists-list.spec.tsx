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
  useNavigation: () => ({ dispatch: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
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
  setPlaylistsAsync: jest.fn().mockResolvedValue(undefined),
  getStateAsync: jest.fn().mockResolvedValue({
    ready: false, isPlaying: false, isLoading: false, currentIndex: -1,
    positionMs: 0, durationMs: 0, bufferedMs: 0, playbackRate: 1,
    repeatMode: 'off', shuffle: false, current: null, queue: [],
  }),
  addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
};

jest.mock('expo-modules-core', () => ({
  requireNativeModule: () => mockPlayer,
}));

const PlaylistsListScreen = require('../../app/(tabs)/playlists/index').default;
const {
  _resetForTests,
  createPlaylist,
  loadPlaylists,
  getPlaylists,
} = require('../lib/playlist-store');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

describe('PlaylistsListScreen', () => {
  beforeEach(async () => {
    AsyncStorage.__store.clear();
    _resetForTests();
    mockPush.mockClear();
    await loadPlaylists();
  });

  it('long-press opens the context menu, selecting Delete then Confirm removes the playlist', async () => {
    const a = await createPlaylist('A');
    const b = await createPlaylist('B');

    const { findByTestId, getByTestId, queryByTestId } = render(<PlaylistsListScreen />);

    const row = await findByTestId(`playlist-tile-${b.id}`);
    fireEvent(row, 'longPress');

    fireEvent.press(getByTestId(`playlist-context-delete-${b.id}`));
    await findByTestId('confirm-delete-sheet');

    fireEvent.press(getByTestId('confirm-delete-confirm'));

    await waitFor(
      () => {
        expect(getPlaylists()).toHaveLength(1);
      },
      { timeout: 5000 },
    );
    expect(getPlaylists()[0].id).toBe(a.id);
    await waitFor(() => {
      expect(queryByTestId(`playlist-tile-${b.id}`)).toBeNull();
    });
  });

  it('cancelling the confirm sheet keeps the playlist', async () => {
    const a = await createPlaylist('Stays');
    const { findByTestId, getByTestId, queryByTestId } = render(<PlaylistsListScreen />);

    const row = await findByTestId(`playlist-tile-${a.id}`);
    fireEvent(row, 'longPress');
    fireEvent.press(getByTestId(`playlist-context-delete-${a.id}`));
    await findByTestId('confirm-delete-sheet');
    fireEvent.press(getByTestId('confirm-delete-cancel'));

    await waitFor(() => {
      expect(queryByTestId('confirm-delete-sheet')).toBeNull();
    });
    expect(getPlaylists()).toHaveLength(1);
  });
});
