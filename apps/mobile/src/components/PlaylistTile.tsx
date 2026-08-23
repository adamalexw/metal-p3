import { memo } from 'react';
import { Text, View } from 'react-native';
import type { Playlist } from '../lib/playlist-store';
import { tw } from '../lib/tw';
import PlaylistMosaic from './PlaylistMosaic';
import PressableTile from './PressableTile';

interface PlaylistTileProps {
  playlist: Playlist;
  index?: number;
  onPress: (playlist: Playlist) => void;
  onLongPress?: (playlist: Playlist) => void;
}

function PlaylistTileImpl({ playlist, index = 0, onPress, onLongPress }: PlaylistTileProps) {
  const trackCount = playlist.trackIds.length;
  const meta = `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`;

  return (
    <PressableTile
      item={playlist}
      index={index}
      onPress={onPress}
      onLongPress={onLongPress}
      testID={`playlist-tile-${playlist.id}`}
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
    </PressableTile>
  );
}

const PlaylistTile = memo(PlaylistTileImpl);
export default PlaylistTile;
