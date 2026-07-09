import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Easing as RNEasing,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Text,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
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
  trackKey?: string | null;
}

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 14;
const HIT_HEIGHT = THUMB_SIZE + 16;

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
  const position = useSharedValue(positionMs);
  const durationSv = useSharedValue(durationMs);
  const isScrubbing = useSharedValue(false);
  const scrubSv = useSharedValue(0);

  const durationRef = useRef(durationMs);
  durationRef.current = durationMs;

  const widthRef = useRef(0);
  const scrubMsRef = useRef<number | null>(null);

  const [scrubbingState, setScrubbingState] = useState(false);
  const [displaySec, setDisplaySec] = useState(() => secOf(positionMs));

  const trackRef = useRef(trackKey);
  const trackChangeTimeRef = useRef(0);

  useEffect(() => {
    durationSv.value = durationMs;
  }, [durationMs, durationSv]);

  // Core synchronization logic. The native player only emits stateChanged on
  // discrete events (play/pause/seek/track change/queue edits), so every event
  // carries an authoritative position: snap to it and restart the linear
  // animation toward the end of the track. Never leave a previous animation
  // running past this point — a stale animation targeting the old track's
  // duration is what makes the bar race to the end.
  useEffect(() => {
    if (isScrubbing.value) return;

    const now = Date.now();
    const isNewTrack = trackKey !== trackRef.current;
    if (isNewTrack) {
      trackRef.current = trackKey;
      trackChangeTimeRef.current = now;
    } else if (durationMs > 0 && positionMs > durationMs + 500) {
      // Mid-transition media3 can pair the outgoing track's position with the
      // incoming track's duration. Applying it would pin the bar at 100% until
      // the track-change event lands ("races to the end and back"). Ignore it;
      // the current animation is still valid.
      return;
    }

    // Right after a transition the controller can briefly report the previous
    // track's position. Treat large positions in that window as stale: start
    // the new track at 0, and for follow-up events keep the locally animated
    // value (already correct after the reset or a local scrub).
    const stale = now - trackChangeTimeRef.current < 2000 && positionMs > 2000;
    const base = stale
      ? isNewTrack
        ? 0
        : Math.min(position.value, durationMs > 0 ? durationMs : position.value)
      : positionMs;

    cancelAnimation(position);
    position.value = base;
    setDisplaySec(secOf(base));

    if (isPlaying && durationMs > 0 && base < durationMs) {
      position.value = withTiming(durationMs, {
        duration: durationMs - base,
        easing: Easing.linear,
      });
    }
  }, [positionMs, durationMs, isPlaying, trackKey, position, isScrubbing]);

  // Read the animated position safely every 250ms to update the text label
  useEffect(() => {
    if (scrubbingState) return;
    const id = setInterval(() => {
      const ms = Math.max(0, Math.min(position.value, durationMs));
      const sec = secOf(ms);
      setDisplaySec((prev) => (prev === sec ? prev : sec));
    }, 250);
    return () => clearInterval(id);
  }, [position, scrubbingState, durationMs]);

  // 1Hz pulse on the elapsed-time text. Driven by RN Animated to avoid an extra Reanimated worklet.
  const tickAnim = useRef(new RNAnimated.Value(1)).current;
  const lastSecRef = useRef(displaySec);
  useEffect(() => {
    if (lastSecRef.current === displaySec) return;
    lastSecRef.current = displaySec;
    if (scrubbingState) return;
    RNAnimated.sequence([
      RNAnimated.timing(tickAnim, {
        toValue: 1.08,
        duration: 90,
        easing: RNEasing.out(RNEasing.quad),
        useNativeDriver: true,
      }),
      RNAnimated.timing(tickAnim, {
        toValue: 1,
        duration: 160,
        easing: RNEasing.inOut(RNEasing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [displaySec, scrubbingState, tickAnim]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
  }, []);

  const positionFromX = (locationX: number) => {
    const w = widthRef.current;
    if (w <= 0 || durationRef.current <= 0) return 0;
    const r = Math.max(0, Math.min(1, locationX / w));
    return Math.round(r * durationRef.current);
  };

  const onStartShouldSetResponder = () => durationRef.current > 0;
  const onMoveShouldSetResponder = () => durationRef.current > 0;
  const onResponderGrant = (e: GestureResponderEvent) => {
    const ms = positionFromX(e.nativeEvent.locationX);
    scrubMsRef.current = ms;
    scrubSv.value = ms;
    isScrubbing.value = true;
    setScrubbingState(true);
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
        // swallow
      }
    }
    isScrubbing.value = false;
    setScrubbingState(false);
    scrubMsRef.current = null;
  };
  const onResponderTerminate = () => {
    isScrubbing.value = false;
    setScrubbingState(false);
    scrubMsRef.current = null;
  };
  const onResponderTerminationRequest = () => false;

  const filledColor = accent;
  const trackColor = withAlpha(mutedForeground, 0.35);

  const fillStyle = useAnimatedStyle(() => {
    const dur = durationSv.value;
    if (dur <= 0) return { width: '0%' as const };
    const live = isScrubbing.value ? scrubSv.value : position.value;
    const ratio = Math.max(0, Math.min(1, live / dur));
    return { width: `${ratio * 100}%` as `${number}%` };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const dur = durationSv.value;
    if (dur <= 0) return { left: '0%' as const };
    const live = isScrubbing.value ? scrubSv.value : position.value;
    const ratio = Math.max(0, Math.min(1, live / dur));
    return { left: `${ratio * 100}%` as `${number}%` };
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
                transform: [{ translateX: -THUMB_SIZE / 2 }],
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

export default PlayerProgressBar;
