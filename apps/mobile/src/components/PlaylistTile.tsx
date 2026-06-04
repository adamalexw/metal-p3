import { memo, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import type { Playlist } from '../lib/playlist-store';
import { tw } from '../lib/tw';
import PlaylistMosaic from './PlaylistMosaic';

const PRESS_TIMING = { duration: 120 };
const ENTRY_DURATION = 280;
const ENTRY_DELAY_STEP = 25;
const ENTRY_DELAY_MAX = 400;

interface PlaylistTileProps {
  playlist: Playlist;
  index?: number;
  onPress: (playlist: Playlist) => void;
  onLongPress?: (playlist: Playlist) => void;
}

function PlaylistTileImpl({ playlist, index = 0, onPress, onLongPress }: PlaylistTileProps) {
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.94]) }],
  }));

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
        runOnJS(onPress)(playlist);
      });

    if (!onLongPress) return tap;

    const longPress = Gesture.LongPress()
      .minDuration(350)
      .onStart(() => {
        'worklet';
        runOnJS(onLongPress)(playlist);
      });

    return Gesture.Race(longPress, tap);
  }, [playlist, onPress, onLongPress, pressed]);

  const trackCount = playlist.trackIds.length;
  const meta = `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`;

  return (
    <Animated.View entering={entering} style={[tw`flex-1 mx-1 mb-4`, animatedStyle]}>
      <GestureDetector gesture={gesture}>
        <View
          testID={`playlist-tile-${playlist.id}`}
          accessibilityRole="button"
          accessibilityLabel={`${playlist.name}, ${meta}`}
        >
          <View
            style={[
              tw`w-full aspect-square rounded-md overflow-hidden bg-[#222]`,
              { boxShadow: '0 6px 10px rgba(0, 0, 0, 0.5)' },
            ]}
          >
            <PlaylistMosaic playlist={playlist} />
          </View>
          <Text style={tw`text-white text-sm font-semibold mt-2`} numberOfLines={1}>
            {playlist.name}
          </Text>
          <Text style={tw`text-[#bbb] text-xs mt-0.5`} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const PlaylistTile = memo(PlaylistTileImpl);
export default PlaylistTile;
