import { Image, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { AlbumGroup } from '../lib/group-tracks-by-album';
import { formatAlbumDuration } from '../lib/group-tracks-by-album';
import { tw } from '../lib/tw';
import { useTrackArtwork } from '../lib/useTrackArtwork';

interface AlbumTileProps {
  group: AlbumGroup;
  onPress: () => void;
  onLongPress?: () => void;
}

const PRESS_SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

export default function AlbumTile({ group, onPress, onLongPress }: AlbumTileProps) {
  const artUri = useTrackArtwork(group.representativeUri);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const meta = `${group.trackCount} ${group.trackCount === 1 ? 'song' : 'songs'} · ${formatAlbumDuration(group.totalDurationMs)}`;

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
        testID={`album-tile-${group.key}`}
        accessibilityRole="button"
        accessibilityLabel={`${group.albumName} by ${group.bandName}, ${meta}`}
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
          {artUri ? (
            <Image source={{ uri: artUri }} style={tw`w-full h-full`} resizeMode="cover" />
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
      </Pressable>
    </Animated.View>
  );
}
