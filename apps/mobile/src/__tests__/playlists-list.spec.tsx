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
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-modules-core', () => ({
  requireNativeModule: () => ({}),
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

    const row = await findByTestId(`playlist-row-${b.id}`);
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
      expect(queryByTestId(`playlist-row-${b.id}`)).toBeNull();
    });
  });

  it('cancelling the confirm sheet keeps the playlist', async () => {
    const a = await createPlaylist('Stays');
    const { findByTestId, getByTestId, queryByTestId } = render(<PlaylistsListScreen />);

    const row = await findByTestId(`playlist-row-${a.id}`);
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
