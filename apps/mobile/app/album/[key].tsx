import { BlurView } from 'expo-blur';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Media } from '../../modules/metalp3-media';
import { MetalP3Player } from '../../modules/metalp3-player';
import { formatAlbumDuration } from '../../src/lib/group-tracks-by-album';
import { findAlbumGroup } from '../../src/lib/library-cache';
import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';

export default function AlbumDetailScreen() {
  const params = useLocalSearchParams<{ key: string }>();
  const rawKey = typeof params.key === 'string' ? params.key : '';
  const albumKey = decodeURIComponent(rawKey);
  const group = findAlbumGroup(albumKey);
  const insets = useSafeAreaInsets();
  const [artUri, setArtUri] = useState<string | null>(null);

  useEffect(() => {
    if (!group) return;
    let cancelled = false;
    MetalP3Media.getArtworkAsync(group.representativeUri)
      .then((art) => {
        if (cancelled || !art) return;
        setArtUri(`data:${art.mimeType};base64,${art.base64}`);
      })
      .catch((err) => {
        console.warn('AlbumDetailScreen: failed to load artwork', err);
      });
    return () => {
      cancelled = true;
    };
  }, [group]);

  if (!group) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Album', headerShown: true, headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }} />
        <Text style={styles.missing} testID="album-missing">
          Album not found. Return to the library and try again.
        </Text>
      </View>
    );
  }

  const meta = `${group.trackCount} ${group.trackCount === 1 ? 'song' : 'songs'} · ${formatAlbumDuration(group.totalDurationMs)}`;

  const playFrom = async (index: number) => {
    await MetalP3Player.setQueueAsync(group.tracks.map(toQueueItem), index, 0);
    await MetalP3Player.play();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: group.albumName,
          headerShown: true,
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerTransparent: false,
        }}
      />

      {artUri ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="album-detail-backdrop">
          <Image source={{ uri: artUri }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={Platform.OS === 'android' ? 25 : 0} />
          {Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, styles.webBackdropOverlay]} />
          ) : (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <View style={[StyleSheet.absoluteFill, styles.darken]} />
        </View>
      ) : null}

      <FlatList
        data={group.tracks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.artwork} testID="album-detail-artwork">
              {artUri ? (
                <Image source={{ uri: artUri }} style={styles.artImage} resizeMode="cover" />
              ) : (
                <View style={styles.artPlaceholder} />
              )}
            </View>
            <Text style={styles.albumName} numberOfLines={2} testID="album-detail-name">
              {group.albumName}
            </Text>
            <Text style={styles.bandName} numberOfLines={1} testID="album-detail-band">
              {group.bandName}
            </Text>
            {group.genre ? (
              <Text style={styles.genre} numberOfLines={1} testID="album-detail-genre">
                {group.genre}
              </Text>
            ) : null}
            <Text style={styles.meta}>{meta}</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            style={styles.row}
            onPress={() => void playFrom(index)}
            testID={`album-track-${item.id}`}
          >
            <Text style={styles.trackNumber}>{formatTrackNumber(item, index)}</Text>
            <View style={styles.trackTextWrap}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {item.title ?? 'Unknown title'}
              </Text>
            </View>
            <Text style={styles.trackDuration}>{formatTrackDuration(item.durationMs)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function formatTrackNumber(track: Track, fallbackIndex: number): string {
  const n = track.trackNumber ?? fallbackIndex + 1;
  return String(n).padStart(2, '0');
}

function formatTrackDuration(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function toQueueItem(t: Track) {
  return {
    id: t.id,
    uri: t.uri,
    title: t.title,
    artist: t.artist,
    album: t.album,
    albumArtist: t.albumArtist,
    durationMs: t.durationMs,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  darken: { backgroundColor: 'rgba(0,0,0,0.55)' },
  webBackdropOverlay: { backgroundColor: 'rgba(0,0,0,0.55)' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, alignItems: 'center' },
  artwork: { width: 220, height: 220, borderRadius: 8, overflow: 'hidden', backgroundColor: '#222', marginBottom: 16 },
  artImage: { width: '100%', height: '100%' },
  artPlaceholder: { width: '100%', height: '100%', backgroundColor: '#222' },
  albumName: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  bandName: { color: '#ddd', fontSize: 16, marginTop: 4, textAlign: 'center' },
  genre: { color: '#bbb', fontSize: 13, marginTop: 4, textAlign: 'center' },
  meta: { color: '#bbb', fontSize: 13, marginTop: 6, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  trackNumber: { color: '#bbb', fontSize: 14, width: 32, fontVariant: ['tabular-nums'] },
  trackTextWrap: { flex: 1, paddingHorizontal: 8 },
  trackTitle: { color: '#fff', fontSize: 15 },
  trackDuration: { color: '#bbb', fontSize: 13, fontVariant: ['tabular-nums'] },
  missing: { color: '#ff6b6b', textAlign: 'center', marginTop: 48, paddingHorizontal: 24 },
});
