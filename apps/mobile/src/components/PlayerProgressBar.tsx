import { useCallback, useRef, useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface Props {
  positionMs: number;
  durationMs: number;
  accent: string;
  mutedForeground: string;
  onSeek: (positionMs: number) => void;
  testID?: string;
}

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 14;
const HIT_HEIGHT = THUMB_SIZE + 16;

export function PlayerProgressBar({
  positionMs,
  durationMs,
  accent,
  mutedForeground,
  onSeek,
  testID,
}: Props) {
  const [width, setWidth] = useState(0);
  const [scrubMs, setScrubMs] = useState<number | null>(null);
  const widthRef = useRef(0);
  const durationRef = useRef(0);
  const scrubRef = useRef<number | null>(null);
  widthRef.current = width;
  durationRef.current = durationMs;
  scrubRef.current = scrubMs;

  const enabled = durationMs > 0;
  const displayMs = scrubMs ?? Math.min(positionMs, durationMs);
  const ratio = enabled ? clamp01(displayMs / durationMs) : 0;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);

  const positionFromX = (locationX: number) => {
    const w = widthRef.current;
    if (w <= 0 || durationRef.current <= 0) return 0;
    const r = clamp01(locationX / w);
    return Math.round(r * durationRef.current);
  };

  const onStartShouldSetResponder = () => durationRef.current > 0;
  const onMoveShouldSetResponder = () => durationRef.current > 0;
  const onResponderGrant = (e: GestureResponderEvent) => {
    setScrubMs(positionFromX(e.nativeEvent.locationX));
  };
  const onResponderMove = (e: GestureResponderEvent) => {
    setScrubMs(positionFromX(e.nativeEvent.locationX));
  };
  const onResponderRelease = () => {
    const ms = scrubRef.current;
    if (ms != null) {
      try {
        onSeek(ms);
      } catch {
        // swallow — next stateChanged will reconcile
      }
    }
    setScrubMs(null);
  };
  const onResponderTerminate = () => setScrubMs(null);
  const onResponderTerminationRequest = () => false;

  const filledColor = accent;
  const trackColor = withAlpha(mutedForeground, 0.35);

  return (
    <View style={styles.wrap} testID={testID}>
      <View
        style={styles.hitArea}
        onLayout={onLayout}
        onStartShouldSetResponder={onStartShouldSetResponder}
        onMoveShouldSetResponder={onMoveShouldSetResponder}
        onResponderGrant={onResponderGrant}
        onResponderMove={onResponderMove}
        onResponderRelease={onResponderRelease}
        onResponderTerminate={onResponderTerminate}
        onResponderTerminationRequest={onResponderTerminationRequest}
      >
        <View style={[styles.track, { backgroundColor: trackColor }]}>
          <View
            style={[
              styles.fill,
              { backgroundColor: filledColor, width: `${ratio * 100}%` },
            ]}
          />
        </View>
        {enabled ? (
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: filledColor,
                left: Math.max(0, ratio * width - THUMB_SIZE / 2),
              },
            ]}
            testID={testID ? `${testID}-thumb` : undefined}
          />
        ) : null}
      </View>
      <View style={styles.timeRow}>
        <Text style={[styles.time, { color: mutedForeground }]}>{fmt(displayMs)}</Text>
        <Text style={[styles.time, { color: mutedForeground }]}>{fmt(durationMs)}</Text>
      </View>
    </View>
  );
}

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const a = clamp01(alpha);
  const aHex = Math.round(a * 255).toString(16).padStart(2, '0');
  return `#${m[1]}${aHex}`;
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingHorizontal: 4 },
  hitArea: {
    height: HIT_HEIGHT,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    top: (HIT_HEIGHT - THUMB_SIZE) / 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});

export default PlayerProgressBar;
