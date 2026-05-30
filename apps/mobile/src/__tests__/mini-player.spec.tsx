import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PlaybackState } from '../../modules/metalp3-player';

const mockPush = jest.fn();
const mockPathname: { current: string } = { current: '/(tabs)' };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname.current,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

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

jest.mock('expo-modules-core', () => ({
  requireNativeModule: () => mockPlayer,
}));

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
  queue: [],
};

const baseTrack = {
  id: '1',
  uri: 'a://1',
  title: 'Hearts Alive',
  artist: 'Mastodon' as string | null,
  album: 'Leviathan',
  albumArtist: 'Mastodon',
  artworkUri: null,
};

const playingState: PlaybackState = {
  ready: true,
  isPlaying: true,
  isLoading: false,
  currentIndex: 0,
  positionMs: 1000,
  durationMs: 200_000,
  bufferedMs: 1000,
  playbackRate: 1,
  repeatMode: 'off',
  shuffle: false,
  current: { ...baseTrack },
  queue: [],
};

const pausedState: PlaybackState = { ...playingState, isPlaying: false };

const albumArtistOnlyState: PlaybackState = {
  ...playingState,
  current: { ...baseTrack, artist: null, albumArtist: 'Mastodon' },
};

const MiniPlayer = require('../components/MiniPlayer').default;

describe('MiniPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.current = '/(tabs)';
    mockPlayer.addListener.mockReturnValue({ remove: jest.fn() });
  });

  it('renders nothing when no track is current', async () => {
    mockPlayer.getStateAsync.mockResolvedValue(idleState);
    const { queryByTestId } = render(<MiniPlayer />);

    await waitFor(() => {
      expect(mockPlayer.getStateAsync).toHaveBeenCalled();
    });
    expect(queryByTestId('mini-player')).toBeNull();
  });

  it('renders title and artist when a track is playing', async () => {
    mockPlayer.getStateAsync.mockResolvedValue(playingState);
    const { findByTestId, getByTestId } = render(<MiniPlayer />);

    await findByTestId('mini-player');
    expect(getByTestId('mini-player-title').props.children).toBe('Hearts Alive');
    expect(getByTestId('mini-player-artist').props.children).toBe('Mastodon');
  });

  it('falls back to albumArtist when artist is null', async () => {
    mockPlayer.getStateAsync.mockResolvedValue(albumArtistOnlyState);
    const { findByTestId } = render(<MiniPlayer />);

    const artist = await findByTestId('mini-player-artist');
    expect(artist.props.children).toBe('Mastodon');
  });

  it('renders nothing when a track is current but paused', async () => {
    mockPlayer.getStateAsync.mockResolvedValue(pausedState);
    const { queryByTestId } = render(<MiniPlayer />);

    await waitFor(() => {
      expect(mockPlayer.getStateAsync).toHaveBeenCalled();
    });
    expect(queryByTestId('mini-player')).toBeNull();
  });

  it('calls pause when currently playing', async () => {
    mockPlayer.getStateAsync.mockResolvedValue(playingState);
    const { findByTestId } = render(<MiniPlayer />);

    fireEvent.press(await findByTestId('mini-player-play'));
    expect(mockPlayer.pauseAsync).toHaveBeenCalledTimes(1);
    expect(mockPlayer.playAsync).not.toHaveBeenCalled();
  });

  it('skip-forward and skip-back invoke matching player APIs', async () => {
    mockPlayer.getStateAsync.mockResolvedValue(playingState);
    const { findByTestId } = render(<MiniPlayer />);

    fireEvent.press(await findByTestId('mini-player-next'));
    fireEvent.press(await findByTestId('mini-player-prev'));
    expect(mockPlayer.skipToNextAsync).toHaveBeenCalledTimes(1);
    expect(mockPlayer.skipToPreviousAsync).toHaveBeenCalledTimes(1);
  });

  it('navigates to /(tabs)/player when body is pressed', async () => {
    mockPlayer.getStateAsync.mockResolvedValue(playingState);
    const { findByTestId } = render(<MiniPlayer />);

    fireEvent.press(await findByTestId('mini-player-body'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/player');
  });

  it('button presses do not trigger navigation', async () => {
    mockPlayer.getStateAsync.mockResolvedValue(playingState);
    const { findByTestId } = render(<MiniPlayer />);

    fireEvent.press(await findByTestId('mini-player-play'));
    fireEvent.press(await findByTestId('mini-player-next'));
    fireEvent.press(await findByTestId('mini-player-prev'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('renders nothing when the current route ends with /player', async () => {
    mockPlayer.getStateAsync.mockResolvedValue(playingState);
    mockPathname.current = '/(tabs)/player';
    const { queryByTestId } = render(<MiniPlayer />);

    await waitFor(() => {
      expect(mockPlayer.getStateAsync).toHaveBeenCalled();
    });
    expect(queryByTestId('mini-player')).toBeNull();
  });
});
