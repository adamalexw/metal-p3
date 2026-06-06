import { Image } from 'expo-image';
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
import type { AlbumGroup } from '../lib/group-tracks-by-album';
import { formatAlbumDuration } from '../lib/group-tracks-by-album';
import { tw } from '../lib/tw';
import { useTrackArtwork, evictTrackArtwork, resetArtworkRetry } from '../lib/useTrackArtwork';

interface AlbumTileProps {
  group: AlbumGroup;
  index?: number;
  onPress: (group: AlbumGroup) => void;
  onLongPress?: (group: AlbumGroup) => void;
}

const PRESS_TIMING = { duration: 120 };
const ENTRY_DURATION = 280;
const ENTRY_DELAY_STEP = 25;
const ENTRY_DELAY_MAX = 400;

function AlbumTileImpl({ group, index = 0, onPress, onLongPress }: AlbumTileProps) {
  const artUri = useTrackArtwork(group.representativeUri);

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
        runOnJS(onPress)(group);
      });

    if (!onLongPress) return tap;

    const longPress = Gesture.LongPress()
      .minDuration(350)
      .onStart(() => {
        'worklet';
        runOnJS(onLongPress)(group);
      });

    return Gesture.Race(longPress, tap);
  }, [group, onPress, onLongPress, pressed]);

  const meta = `${group.trackCount} ${group.trackCount === 1 ? 'song' : 'songs'} · ${formatAlbumDuration(group.totalDurationMs)}`;

  return (
    <Animated.View entering={entering} style={[tw`flex-1 mx-1 mb-4`, animatedStyle]}>
      <GestureDetector gesture={gesture}>
        <View
          testID={`album-tile-${group.key}`}
          accessibilityRole="button"
          accessibilityLabel={`${group.albumName} by ${group.bandName}, ${meta}`}
        >
          <View
            style={[
              tw`w-full aspect-square rounded-md overflow-hidden bg-[#222]`,
              { boxShadow: '0 6px 10px rgba(0, 0, 0, 0.5)' },
            ]}
          >
            {artUri ? (
              <Image
                source={{ uri: artUri }}
                style={tw`w-full h-full`}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={artUri}
                transition={120}
                onLoad={() => {
                  if (group.representativeUri) {
                    resetArtworkRetry(group.representativeUri);
                  }
                }}
                onError={() => {
                  if (group.representativeUri) {
                    evictTrackArtwork(group.representativeUri);
                  }
                }}
              />
            ) : (
              <View style={tw`w-full h-full bg-[#222]`} />
            )}
          </View>
          <Text style={tw`text-white text-sm font-semibold mt-2`} numberOfLines={1}>
            {group.albumName}
          </Text>
          <Text style={tw`text-[#ddd] text-[13px] mt-0.5`} numberOfLines={1}>
            {group.bandName}
          </Text>
          {group.genre ? (
            <Text style={tw`text-[#bbb] text-xs mt-0.5`} numberOfLines={1}>
              {group.genre}
            </Text>
          ) : null}
          <Text style={tw`text-[#bbb] text-xs mt-0.5`} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const AlbumTile = memo(AlbumTileImpl);
export default AlbumTile;
