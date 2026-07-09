import { act, render } from '@testing-library/react-native';
import { PlayerProgressBar } from '../components/PlayerProgressBar';

// The shared global mock returns a fresh shared-value object on every render,
// which resets `position.value` and prevents the component's local
// interpolation interval from advancing. Override it here with a ref-backed
// stable shared value so the elapsed-time interpolation behaves like the real
// reanimated runtime.
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const RN = require('react-native');
  const { View } = RN;
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: unknown) => c },
    View,
    cancelAnimation: jest.fn(),
    Easing: { linear: (v: unknown) => v },
    useSharedValue: (v: unknown) => React.useRef({ value: v }).current,
    useAnimatedStyle: () => ({}),
    withSpring: (v: unknown) => v,
    withTiming: (v: unknown) => v,
  };
});

function flatten<T>(style: T | T[] | null | undefined): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.flat().filter(Boolean).map((s) => flatten(s as never)));
  }
  return style as unknown as Record<string, unknown>;
}

interface InstanceLike {
  type: unknown;
  props: Record<string, unknown>;
}

function findHitArea(root: ReturnType<typeof render>) {
  return root.UNSAFE_root.findAll(
    (node: InstanceLike) =>
      typeof node.type === 'string' &&
      node.props != null &&
      typeof node.props.onLayout === 'function' &&
      typeof node.props.onResponderGrant === 'function',
  )[0];
}

describe('PlayerProgressBar', () => {
  it('renders the thumb in the accent color when duration is known', () => {
    const onSeek = jest.fn();
    const r = render(
      <PlayerProgressBar
        positionMs={30_000}
        durationMs={120_000}
        accent="#ff0066"
        mutedForeground="#bbbbbb"
        onSeek={onSeek}
        testID="progress"
      />,
    );

    const thumb = r.getByTestId('progress-thumb');
    expect(flatten(thumb.props.style).backgroundColor).toBe('#ff0066');
  });

  it('does not render the thumb when duration is unknown', () => {
    const onSeek = jest.fn();
    const r = render(
      <PlayerProgressBar
        positionMs={0}
        durationMs={0}
        accent="#ff0066"
        mutedForeground="#bbbbbb"
        onSeek={onSeek}
        testID="progress"
      />,
    );

    expect(r.queryByTestId('progress-thumb')).toBeNull();
  });

  it('calls onSeek with the released scrub position', () => {
    const onSeek = jest.fn();
    const r = render(
      <PlayerProgressBar
        positionMs={0}
        durationMs={100_000}
        accent="#ff0066"
        mutedForeground="#bbbbbb"
        onSeek={onSeek}
        testID="progress"
      />,
    );

    const hitArea = findHitArea(r);
    expect(hitArea).toBeDefined();

    act(() => {
      (hitArea.props.onLayout as (e: unknown) => void)({
        nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 24 } },
      });
    });

    const onResponderGrant = hitArea.props.onResponderGrant as (e: unknown) => void;
    const onResponderMove = hitArea.props.onResponderMove as (e: unknown) => void;
    const onResponderRelease = hitArea.props.onResponderRelease as () => void;

    act(() => {
      onResponderGrant({ nativeEvent: { locationX: 50, locationY: 12 } });
    });
    act(() => {
      onResponderMove({ nativeEvent: { locationX: 100, locationY: 12 } });
    });
    act(() => {
      onResponderRelease();
    });

    expect(onSeek).toHaveBeenCalledTimes(1);
    expect(onSeek).toHaveBeenCalledWith(50_000);
  });

  it('does not seek when duration is unknown', () => {
    const onSeek = jest.fn();
    const r = render(
      <PlayerProgressBar
        positionMs={0}
        durationMs={0}
        accent="#ff0066"
        mutedForeground="#bbbbbb"
        onSeek={onSeek}
        testID="progress"
      />,
    );

    const hitArea = r.UNSAFE_root.findAll(
      (n: InstanceLike) =>
        typeof n.type === 'string' &&
        typeof n.props.onStartShouldSetResponder === 'function',
    )[0];
    const onStartShouldSetResponder = hitArea.props
      .onStartShouldSetResponder as () => boolean;

    expect(onStartShouldSetResponder()).toBe(false);
    expect(onSeek).not.toHaveBeenCalled();
  });

  it('resets the elapsed time when the track changes even if positionMs stays 0', () => {
    const onSeek = jest.fn();
    const r = render(
      <PlayerProgressBar
        positionMs={3000}
        durationMs={120_000}
        isPlaying
        trackKey="track-a"
        accent="#ff0066"
        mutedForeground="#bbbbbb"
        onSeek={onSeek}
        testID="progress"
      />,
    );

    expect(r.getByText('0:03')).toBeTruthy();

    // Next track starts: the native player reports positionMs 0 again, so the
    // only thing that changes is the track identity. The bar must reset.
    r.rerender(
      <PlayerProgressBar
        positionMs={0}
        durationMs={120_000}
        isPlaying
        trackKey="track-b"
        accent="#ff0066"
        mutedForeground="#bbbbbb"
        onSeek={onSeek}
        testID="progress"
      />,
    );

    expect(r.getByText('0:00')).toBeTruthy();
  });

  it('ignores a stale position paired with the next track duration mid-transition', () => {
    const onSeek = jest.fn();
    const r = render(
      <PlayerProgressBar
        positionMs={5000}
        durationMs={200_000}
        isPlaying
        trackKey="track-a"
        accent="#ff0066"
        mutedForeground="#bbbbbb"
        onSeek={onSeek}
        testID="progress"
      />,
    );

    expect(r.getByText('0:05')).toBeTruthy();

    // Mid-transition media3 can report the outgoing track's position (198s)
    // against the incoming track's duration (90s) before the track key
    // updates. The bar must not jump to the end.
    r.rerender(
      <PlayerProgressBar
        positionMs={198_000}
        durationMs={90_000}
        isPlaying
        trackKey="track-a"
        accent="#ff0066"
        mutedForeground="#bbbbbb"
        onSeek={onSeek}
        testID="progress"
      />,
    );

    expect(r.getByText('0:05')).toBeTruthy();
  });
});
