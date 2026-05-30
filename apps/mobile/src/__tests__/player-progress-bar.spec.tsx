import { act, render } from '@testing-library/react-native';
import { PlayerProgressBar } from '../components/PlayerProgressBar';

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
});
