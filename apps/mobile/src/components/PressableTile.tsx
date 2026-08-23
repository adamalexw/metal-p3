import { useMemo, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { tw } from '../lib/tw';

const PRESS_TIMING = { duration: 120 };
const ENTRY_DURATION = 280;
const ENTRY_DELAY_STEP = 25;
const ENTRY_DELAY_MAX = 400;

interface PressableTileProps<T> {
  item: T;
  index?: number;
  onPress: (item: T) => void;
  onLongPress?: (item: T) => void;
  accessibilityLabel: string;
  testID?: string;
  children: ReactNode;
}

/**
 * Grid-tile chrome shared by the Library and Playlists grids: press-scale
 * feedback, staggered fade-in entry, and tap/long-press gestures that hand
 * the item back to the parent's callbacks.
 */
export default function PressableTile<T>({
  item,
  index = 0,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
  children,
}: PressableTileProps<T>) {
  // pressed is the *state* (0 = idle, 1 = pressed). Visual scale is derived
  // via interpolate so we can change the curve without rewriting handlers.
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.94]) }],
  }));

  // Entry animation runs once per tile lifetime — re-renders shouldn't re-fade.
  const hasEntered = useRef(false);
  const entering = hasEntered.current
    ? undefined
    : FadeInUp.duration(ENTRY_DURATION).delay(Math.min(index * ENTRY_DELAY_STEP, ENTRY_DELAY_MAX));
  hasEntered.current = true;

  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .onBegin(() => {
        'worklet';
        pressed.value = withTiming(1, PRESS_TIMING);
      })
      .onFinalize(() => {
        'worklet';
        pressed.value = withTiming(0, PRESS_TIMING);
      })
      .onEnd(() => {
        'worklet';
        runOnJS(onPress)(item);
      });

    if (!onLongPress) return tap;

    const longPress = Gesture.LongPress()
      .minDuration(350)
      .onStart(() => {
        'worklet';
        runOnJS(onLongPress)(item);
      });

    return Gesture.Race(longPress, tap);
  }, [item, onPress, onLongPress, pressed]);

  return (
    <Animated.View entering={entering} style={[tw`flex-1 mx-1 mb-4`, animatedStyle]}>
      <GestureDetector gesture={gesture}>
        <View testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
          {children}
        </View>
      </GestureDetector>
    </Animated.View>
  );
}
