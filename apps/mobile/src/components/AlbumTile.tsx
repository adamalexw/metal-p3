import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { MetalP3Media } from '../../modules/metalp3-media';
import type { AlbumGroup } from '../lib/group-tracks-by-album';
import { formatAlbumDuration } from '../lib/group-tracks-by-album';
import { tw } from '../lib/tw';

interface AlbumTileProps {
  group: AlbumGroup;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function AlbumTile({ group, onPress, onLongPress }: AlbumTileProps) {
  const [artUri, setArtUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    MetalP3Media.getArtworkAsync(group.representativeUri)
      .then((art) => {
        if (cancelled || !art) return;
        setArtUri(`data:${art.mimeType};base64,${art.base64}`);
      })
      .catch((err) => {
        console.warn('AlbumTile: failed to load artwork', err);
      });
    return () => {
      cancelled = true;
    };
  }, [group.representativeUri]);

  const meta = `${group.trackCount} ${group.trackCount === 1 ? 'song' : 'songs'} · ${formatAlbumDuration(group.totalDurationMs)}`;

  return (
    <Pressable
      style={tw`flex-1 mx-1 mb-4`}
      onPress={onPress}
      onLongPress={onLongPress}
      testID={`album-tile-${group.key}`}
      accessibilityRole="button"
      accessibilityLabel={`${group.albumName} by ${group.bandName}, ${meta}`}
    >
      <View style={tw`w-full aspect-square rounded-md overflow-hidden bg-[#222]`}>
        {artUri ? (
          <Image source={{ uri: artUri }} style={tw`w-full h-full`} resizeMode="cover" />
        ) : (
          <View style={tw`w-full h-full bg-[#222]`} />
        )}
      </View>
      <Text style={tw`text-white text-sm font-semibold mt-2`} numberOfLines={1}>
        {group.albumName}
      </Text>
      <Text style={tw`text-[#aaa] text-[13px] mt-0.5`} numberOfLines={1}>
        {group.bandName}
      </Text>
      {group.genre ? (
        <Text style={tw`text-[#888] text-xs mt-0.5`} numberOfLines={1}>
          {group.genre}
        </Text>
      ) : null}
      <Text style={tw`text-[#888] text-xs mt-0.5`} numberOfLines={1}>
        {meta}
      </Text>
    </Pressable>
  );
}
