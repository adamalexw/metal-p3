import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Easing,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { withAlpha } from '../lib/color';
import { tw } from '../lib/tw';

interface Props {
  positionMs: number;
  durationMs: number;
  isPlaying?: boolean;
  accent: string;
  mutedForeground: string;
  onSeek: (positionMs: number) => void;
  testID?: string;
  // Identifies the current track. Changing this forces a position reset even
  // when positionMs stays the same (the native player reports 0 at the start
  // of every track, so 0 -> 0 transitions would otherwise be missed).
  trackKey?: string | null;
}

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 14;
const HIT_HEIGHT = THUMB_SIZE + 16;
const TICK_INTERVAL_MS = 250;

export function PlayerProgressBar({
  positionMs,
  durationMs,
  isPlaying = true,
  accent,
  mutedForeground,
  onSeek,
  testID,
  trackKey,
}: Props) {
  // Shared values drive the visible position and width on the UI thread, so
  // the fill bar and thumb update smoothly without re-rendering React. Width
  // is still kept in state because the test harness reads it, and so the
  // initial mount can compute its own ratio without waiting a frame.
  const position = useSharedValue(positionMs);
  const widthSv = useSharedValue(0);
  const durationSv = useSharedValue(durationMs);
  const scrubSv = useSharedValue<number>(-1); // -1 => not scrubbing
  const isScrubbing = useSharedValue(false);

  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const durationRef = useRef(0);
  const scrubMsRef = useRef<number | null>(null);
  widthRef.current = width;
  durationRef.current = durationMs;

  const [scrubbing, setScrubbing] = useState(false);
  const [displaySec, setDisplaySec] = useState(() => secOf(positionMs));

  // Keep the duration shared value in sync with the prop.
  useEffect(() => {
    durationSv.value = durationMs;
  }, [durationMs, durationSv]);

  // Snap the position whenever the source-of-truth prop changes (track change,
  // server reconcile, scrub release reflected back). trackKey is included so a
  // track change resets the bar even when positionMs is unchanged (0 -> 0).
  useEffect(() => {
    position.value = positionMs;
    setDisplaySec(secOf(positionMs));
  }, [positionMs, trackKey, position]);

  // While playing (and not scrubbing), advance the shared value locally so the
  // bar moves between server updates. JS interval is fine here — it only
  // writes a shared value (no re-render) and bumps `displaySec` once a second.
  useEffect(() => {
    if (scrubbing) return;
    if (!isPlaying || durationMs <= 0) return;
    const startedAt = Date.now();
    const baseMs = position.value;
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(baseMs + elapsed, durationMs);
      position.value = next;
      const sec = secOf(next);
      setDisplaySec((prev) => (prev === sec ? prev : sec));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [positionMs, trackKey, durationMs, isPlaying, scrubbing, position]);

  // 1Hz pulse on the elapsed-time text. Driven by RN Animated to avoid an
  // extra Reanimated worklet for a once-per-second visual blip.
  const tickAnim = useRef(new RNAnimated.Value(1)).current;
  const lastSecRef = useRef(displaySec);
  useEffect(() => {
    if (lastSecRef.current === displaySec) return;
    lastSecRef.current = displaySec;
    if (scrubbing) return;
    RNAnimated.sequence([
      RNAnimated.timing(tickAnim, {
        toValue: 1.08,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      RNAnimated.timing(tickAnim, {
        toValue: 1,
        duration: 160,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [displaySec, scrubbing, tickAnim]);

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      setWidth(w);
      widthSv.value = w;
    },
    [widthSv],
  );

  const positionFromX = (locationX: number) => {
    const w = widthRef.current;
    if (w <= 0 || durationRef.current <= 0) return 0;
    const r = clamp01(locationX / w);
    return Math.round(r * durationRef.current);
  };

  const onStartShouldSetResponder = () => durationRef.current > 0;
  const onMoveShouldSetResponder = () => durationRef.current > 0;
  const onResponderGrant = (e: GestureResponderEvent) => {
    const ms = positionFromX(e.nativeEvent.locationX);
    scrubMsRef.current = ms;
    scrubSv.value = ms;
    isScrubbing.value = true;
    setScrubbing(true);
    setDisplaySec(secOf(ms));
  };
  const onResponderMove = (e: GestureResponderEvent) => {
    const ms = positionFromX(e.nativeEvent.locationX);
    scrubMsRef.current = ms;
    scrubSv.value = ms;
    setDisplaySec((prev) => {
      const next = secOf(ms);
      return prev === next ? prev : next;
    });
  };
  const onResponderRelease = () => {
    const ms = scrubMsRef.current;
    if (ms != null) {
      position.value = ms;
      setDisplaySec(secOf(ms));
      try {
        onSeek(ms);
      } catch {
        // swallow — next stateChanged will reconcile
      }
    }
    isScrubbing.value = false;
    setScrubbing(false);
    scrubMsRef.current = null;
  };
  const onResponderTerminate = () => {
    isScrubbing.value = false;
    setScrubbing(false);
    scrubMsRef.current = null;
  };
  const onResponderTerminationRequest = () => false;

  const filledColor = accent;
  const trackColor = withAlpha(mutedForeground, 0.35);

  // Animated styles: width of the fill, and the thumb's left offset.
  const fillStyle = useAnimatedStyle(() => {
    const dur = durationSv.value;
    if (dur <= 0) return { width: '0%' as const };
    const live = isScrubbing.value ? scrubSv.value : position.value;
    const ratio = clampWorklet(live / dur);
    return { width: `${ratio * 100}%` as `${number}%` };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const dur = durationSv.value;
    const w = widthSv.value;
    if (dur <= 0 || w <= 0) return { left: 0 };
    const live = isScrubbing.value ? scrubSv.value : position.value;
    const ratio = clampWorklet(live / dur);
    return { left: Math.max(0, ratio * w - THUMB_SIZE / 2) };
  });

  const enabled = durationMs > 0;
  const displayMs = displaySec * 1000;

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
          pointerEvents="none"
          style={[
            tw`overflow-hidden`,
            { height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, backgroundColor: trackColor },
          ]}
        >
          <Animated.View style={[tw`h-full`, { backgroundColor: filledColor }, fillStyle]} />
        </View>
        {enabled ? (
          <Animated.View
            pointerEvents="none"
            style={[
              tw`absolute`,
              {
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                top: (HIT_HEIGHT - THUMB_SIZE) / 2,
                backgroundColor: filledColor,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
              },
              thumbStyle,
            ]}
            testID={testID ? `${testID}-thumb` : undefined}
          />
        ) : null}
      </View>
      <View style={tw`flex-row justify-between mt-0.5`}>
        <RNAnimated.Text
          style={[
            tw`text-xs`,
            {
              color: mutedForeground,
              fontVariant: ['tabular-nums'],
              transform: [{ scale: tickAnim }],
            },
          ]}
        >
          {fmt(displayMs)}
        </RNAnimated.Text>
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

function secOf(ms: number): number {
  return Math.max(0, Math.floor(ms / 1000));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampWorklet(value: number): number {
  'worklet';
  return Math.max(0, Math.min(1, value));
}

export default PlayerProgressBar;
