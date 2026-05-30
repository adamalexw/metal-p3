import { useCallback, useRef, useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Text,
  View,
} from 'react-native';
import { tw } from '../lib/tw';

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
    <View style={tw`w-full px-1`} testID={testID}>
      <View
        style={[tw`justify-center`, { height: HIT_HEIGHT }]}
        onLayout={onLayout}
        onStartShouldSetResponder={onStartShouldSetResponder}
        onMoveShouldSetResponder={onMoveShouldSetResponder}
        onResponderGrant={onResponderGrant}
        onResponderMove={onResponderMove}
        onResponderRelease={onResponderRelease}
        onResponderTerminate={onResponderTerminate}
        onResponderTerminationRequest={onResponderTerminationRequest}
      >
        <View
          style={[
            tw`overflow-hidden`,
            { height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, backgroundColor: trackColor },
          ]}
        >
          <View
            style={[tw`h-full`, { backgroundColor: filledColor, width: `${ratio * 100}%` }]}
          />
        </View>
        {enabled ? (
          <View
            style={[
              tw`absolute`,
              {
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                top: (HIT_HEIGHT - THUMB_SIZE) / 2,
                backgroundColor: filledColor,
                left: Math.max(0, ratio * width - THUMB_SIZE / 2),
                shadowColor: '#000',
                shadowOpacity: 0.3,
                shadowRadius: 3,
                shadowOffset: { width: 0, height: 1 },
                elevation: 3,
              },
            ]}
            testID={testID ? `${testID}-thumb` : undefined}
          />
        ) : null}
      </View>
      <View style={tw`flex-row justify-between mt-0.5`}>
        <Text style={[tw`text-xs`, { color: mutedForeground, fontVariant: ['tabular-nums'] }]}>
          {fmt(displayMs)}
        </Text>
        <Text style={[tw`text-xs`, { color: mutedForeground, fontVariant: ['tabular-nums'] }]}>
          {fmt(durationMs)}
        </Text>
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

export default PlayerProgressBar;
