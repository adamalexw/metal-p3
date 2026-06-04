import { memo, useCallback, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { Playlist } from '../lib/playlist-store';
import { tw } from '../lib/tw';
import PlaylistMosaic from './PlaylistMosaic';

const PRESS_SPRING = { damping: 18, stiffness: 320, mass: 0.6 };
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
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const hasEntered = useRef(false);
  const entering = hasEntered.current
    ? undefined
    : FadeInUp.duration(ENTRY_DURATION).delay(Math.min(index * ENTRY_DELAY_STEP, ENTRY_DELAY_MAX));
  hasEntered.current = true;

  const handlePress = useCallback(() => onPress(playlist), [onPress, playlist]);
  const handleLongPress = useCallback(() => onLongPress?.(playlist), [onLongPress, playlist]);
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.94, PRESS_SPRING);
  }, [scale]);
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, PRESS_SPRING);
  }, [scale]);

  const trackCount = playlist.trackIds.length;
  const meta = `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`;

  return (
    <Animated.View entering={entering} style={[tw`flex-1 mx-1 mb-4`, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress ? handleLongPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`playlist-tile-${playlist.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${playlist.name}, ${meta}`}
      >
        <View
          style={[
            tw`w-full aspect-square rounded-md overflow-hidden bg-[#222]`,
            {
              shadowColor: '#000',
              shadowOpacity: 0.5,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            },
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
      </Pressable>
    </Animated.View>
  );
}

const PlaylistTile = memo(PlaylistTileImpl);
export default PlaylistTile;
