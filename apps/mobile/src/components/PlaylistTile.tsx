import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { Playlist } from '../lib/playlist-store';
import { tw } from '../lib/tw';
import PlaylistMosaic from './PlaylistMosaic';

const PRESS_SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

interface PlaylistTileProps {
  playlist: Playlist;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function PlaylistTile({ playlist, onPress, onLongPress }: PlaylistTileProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const trackCount = playlist.trackIds.length;
  const meta = `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`;

  return (
    <Animated.View style={[tw`flex-1 mx-1 mb-4`, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => {
          scale.value = withSpring(0.94, PRESS_SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, PRESS_SPRING);
        }}
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
