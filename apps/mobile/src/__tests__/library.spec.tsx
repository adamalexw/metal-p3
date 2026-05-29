import { render } from '@testing-library/react-native';

jest.mock('expo-modules-core', () => {
  const mediaMock = {
    audioPermission: 'android.permission.READ_MEDIA_AUDIO',
    getPermissionsAsync: jest.fn().mockResolvedValue({ granted: false, permission: 'android.permission.READ_MEDIA_AUDIO' }),
    scanAudioAsync: jest.fn().mockResolvedValue([]),
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
  it('renders the library heading', () => {
    const { getByTestId } = render(<LibraryScreen />);
    expect(getByTestId('library-heading').props.children).toBe('Library');
  });
});
