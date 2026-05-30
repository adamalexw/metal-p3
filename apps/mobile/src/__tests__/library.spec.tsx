import { render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-modules-core', () => {
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

  const mediaMock = {
    audioPermission: 'android.permission.READ_MEDIA_AUDIO',
    getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, permission: 'android.permission.READ_MEDIA_AUDIO' }),
    scanAudioAsync: jest.fn().mockResolvedValue(tracks),
    searchAsync: jest.fn().mockResolvedValue([]),
    getTrackAsync: jest.fn().mockResolvedValue(null),
    getArtworkAsync: jest.fn().mockResolvedValue(null),
  };
  const playerMock = {
    setQueueAsync: jest.fn().mockResolvedValue(undefined),
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
      repeatMode: 'off', shuffle: false, current: null,
    }),
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  };
  return {
    requireNativeModule: (name: string) => name === 'MetalP3Player' ? playerMock : mediaMock,
  };
});

const LibraryScreen = require('../../app/(tabs)/index').default;

describe('LibraryScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
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
});
