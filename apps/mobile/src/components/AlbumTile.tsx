import { memo } from 'react';
import { Text, View } from 'react-native';
import type { AlbumGroup } from '../lib/group-tracks-by-album';
import { formatAlbumDuration } from '../lib/group-tracks-by-album';
import { tw } from '../lib/tw';
import { useTrackArtwork } from '../lib/useTrackArtwork';
import PressableTile from './PressableTile';
import RetryingArtwork from './RetryingArtwork';

interface AlbumTileProps {
  group: AlbumGroup;
  index?: number;
  onPress: (group: AlbumGroup) => void;
  onLongPress?: (group: AlbumGroup) => void;
}

function AlbumTileImpl({ group, index = 0, onPress, onLongPress }: AlbumTileProps) {
  const artUri = useTrackArtwork(group.representativeUri);

  const meta = `${group.trackCount} ${group.trackCount === 1 ? 'song' : 'songs'} · ${formatAlbumDuration(group.totalDurationMs)}`;

  return (
    <PressableTile
      item={group}
      index={index}
      onPress={onPress}
      onLongPress={onLongPress}
      testID={`album-tile-${group.key}`}
      accessibilityLabel={`${group.albumName} by ${group.bandName}, ${meta}`}
    >
      <View
        style={[
          tw`w-full aspect-square rounded-md overflow-hidden bg-[#222]`,
          { boxShadow: '0 6px 10px rgba(0, 0, 0, 0.5)' },
        ]}
      >
        {artUri ? (
          <RetryingArtwork uri={artUri} style={tw`w-full h-full`} />
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
    </PressableTile>
  );
}

const AlbumTile = memo(AlbumTileImpl);
export default AlbumTile;
