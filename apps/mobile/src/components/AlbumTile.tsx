import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MetalP3Media } from '../../modules/metalp3-media';
import type { AlbumGroup } from '../lib/group-tracks-by-album';
import { formatAlbumDuration } from '../lib/group-tracks-by-album';

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
      style={styles.tile}
      onPress={onPress}
      onLongPress={onLongPress}
      testID={`album-tile-${group.key}`}
      accessibilityRole="button"
      accessibilityLabel={`${group.albumName} by ${group.bandName}, ${meta}`}
    >
      <View style={styles.artwork}>
        {artUri ? (
          <Image source={{ uri: artUri }} style={styles.artImage} resizeMode="cover" />
        ) : (
          <View style={styles.artPlaceholder} />
        )}
      </View>
      <Text style={styles.albumName} numberOfLines={1}>
        {group.albumName}
      </Text>
      <Text style={styles.bandName} numberOfLines={1}>
        {group.bandName}
      </Text>
      {group.genre ? (
        <Text style={styles.meta} numberOfLines={1}>
          {group.genre}
        </Text>
      ) : null}
      <Text style={styles.meta} numberOfLines={1}>
        {meta}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, marginHorizontal: 4, marginBottom: 16 },
  artwork: { width: '100%', aspectRatio: 1, borderRadius: 6, overflow: 'hidden', backgroundColor: '#222' },
  artImage: { width: '100%', height: '100%' },
  artPlaceholder: { width: '100%', height: '100%', backgroundColor: '#222' },
  albumName: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 8 },
  bandName: { color: '#aaa', fontSize: 13, marginTop: 2 },
  meta: { color: '#888', fontSize: 12, marginTop: 2 },
});
