import { fireEvent, render } from '@testing-library/react-native';
import type { QueueItem } from '../../modules/metalp3-player';
import type { ArtworkTheme } from '../theme/types';

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
  moveQueueItemAsync: jest.fn().mockResolvedValue(undefined),
  getStateAsync: jest.fn(),
  addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
};

jest.mock('expo-modules-core', () => ({
  requireNativeModule: () => mockPlayer,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

interface DragEndArgs {
  data: QueueItem[];
  from: number;
  to: number;
}

let lastOnDragEnd: ((args: DragEndArgs) => void) | null = null;

jest.mock('react-native-draggable-flatlist', () => {
  const React = require('react');
  const { View } = require('react-native');
  function DraggableFlatList(props: {
    data: QueueItem[];
    renderItem: (params: {
      item: QueueItem;
      drag: () => void;
      isActive: boolean;
      getIndex: () => number;
    }) => unknown;
    onDragEnd: (args: DragEndArgs) => void;
  }) {
    lastOnDragEnd = props.onDragEnd;
    return React.createElement(
      View,
      { testID: 'queue-list' },
      props.data.map((item, index) =>
        React.createElement(
          View,
          { key: item.id },
          props.renderItem({
            item,
            drag: jest.fn(),
            isActive: false,
            getIndex: () => index,
          }) as React.ReactElement,
        ),
      ),
    );
  }
  return {
    __esModule: true,
    default: DraggableFlatList,
    ScaleDecorator: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

const QueueSheet = require('../components/QueueSheet').default;

const theme: ArtworkTheme = {
  background: '#101010',
  surface: '#202020',
  foreground: '#ffffff',
  mutedForeground: '#bbbbbb',
  accent: '#ff0066',
  accentForeground: '#000000',
  artworkDataUri: null,
  loading: false,
};

const queue: QueueItem[] = [
  { id: 'a', uri: 'a://1', title: 'Track A', artist: 'Band', album: 'Album', albumArtist: 'Band', artworkUri: null },
  { id: 'b', uri: 'a://2', title: 'Track B', artist: 'Band', album: 'Album', albumArtist: 'Band', artworkUri: null },
  { id: 'c', uri: 'a://3', title: 'Track C', artist: 'Band', album: 'Album', albumArtist: 'Band', artworkUri: null },
];

describe('QueueSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastOnDragEnd = null;
  });

  it('renders queue rows for each item', () => {
    const { getByTestId } = render(
      <QueueSheet
        visible={true}
        onClose={() => undefined}
        queue={queue}
        currentIndex={0}
        theme={theme}
      />,
    );

    getByTestId('queue-row-a');
    getByTestId('queue-row-b');
    getByTestId('queue-row-c');
  });

  it('calls MetalP3Player.moveQueueItem with the drag-end indices', () => {
    render(
      <QueueSheet
        visible={true}
        onClose={() => undefined}
        queue={queue}
        currentIndex={0}
        theme={theme}
      />,
    );

    expect(lastOnDragEnd).toBeTruthy();
    lastOnDragEnd?.({ data: [queue[2], queue[0], queue[1]], from: 2, to: 0 });

    expect(mockPlayer.moveQueueItemAsync).toHaveBeenCalledWith(2, 0);
  });

  it('does not call moveQueueItem when from === to', () => {
    render(
      <QueueSheet
        visible={true}
        onClose={() => undefined}
        queue={queue}
        currentIndex={0}
        theme={theme}
      />,
    );

    lastOnDragEnd?.({ data: queue, from: 1, to: 1 });
    expect(mockPlayer.moveQueueItemAsync).not.toHaveBeenCalled();
  });

  it('invokes onClose when the close button is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <QueueSheet
        visible={true}
        onClose={onClose}
        queue={queue}
        currentIndex={0}
        theme={theme}
      />,
    );

    fireEvent.press(getByTestId('player-queue-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
