import { memo, useCallback, useRef } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
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
  index?: number;
  onPress: (group: AlbumGroup) => void;
  onLongPress?: (group: AlbumGroup) => void;
}

const PRESS_SPRING = { damping: 18, stiffness: 320, mass: 0.6 };
const ENTRY_DURATION = 280;
const ENTRY_DELAY_STEP = 25;
const ENTRY_DELAY_MAX = 400;

function AlbumTileImpl({ group, index = 0, onPress, onLongPress }: AlbumTileProps) {
  const artUri = useTrackArtwork(group.representativeUri);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Entry animation runs once per tile lifetime — re-renders shouldn't re-fade.
  const hasEntered = useRef(false);
  const entering = hasEntered.current
    ? undefined
    : FadeInUp.duration(ENTRY_DURATION).delay(Math.min(index * ENTRY_DELAY_STEP, ENTRY_DELAY_MAX));
  hasEntered.current = true;

  const handlePress = useCallback(() => onPress(group), [onPress, group]);
  const handleLongPress = useCallback(() => onLongPress?.(group), [onLongPress, group]);
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.94, PRESS_SPRING);
  }, [scale]);
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, PRESS_SPRING);
  }, [scale]);

  const meta = `${group.trackCount} ${group.trackCount === 1 ? 'song' : 'songs'} · ${formatAlbumDuration(group.totalDurationMs)}`;

  return (
    <Animated.View entering={entering} style={[tw`flex-1 mx-1 mb-4`, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress ? handleLongPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
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

const AlbumTile = memo(AlbumTileImpl);
export default AlbumTile;
