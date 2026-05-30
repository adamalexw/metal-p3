import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Media } from '../../modules/metalp3-media';
import AlbumTile from '../../src/components/AlbumTile';
import type { AlbumGroup } from '../../src/lib/group-tracks-by-album';
import { setLibraryTracks } from '../../src/lib/library-cache';

type AlbumRow =
  | { kind: 'pair'; key: string; left: AlbumGroup; right: AlbumGroup }
  | { kind: 'wide'; key: string; item: AlbumGroup };

function buildRows(albums: AlbumGroup[]): AlbumRow[] {
  const rows: AlbumRow[] = [];
  let i = 0;
  while (i < albums.length) {
    const isLast = i === albums.length - 1;
    if (isLast && (albums.length % 2 === 1)) {
      rows.push({ kind: 'wide', key: albums[i].key, item: albums[i] });
      i += 1;
    } else {
      rows.push({ kind: 'pair', key: `${albums[i].key}|${albums[i + 1].key}`, left: albums[i], right: albums[i + 1] });
      i += 2;
    }
  }
  return rows;
}

type Status = 'idle' | 'checking' | 'denied' | 'loading' | 'ready' | 'error';

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<Status>('idle');
  const [albums, setAlbums] = useState<AlbumGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('checking');
    setError(null);
    try {
      const granted = (await MetalP3Media.getPermissionsAsync()).granted
        || (await MetalP3Media.requestPermissionsAsync()).granted;
      if (!granted) {
        setStatus('denied');
        return;
      }
      setStatus('loading');
      const result = await MetalP3Media.scanAudioAsync({ minDurationMs: 10_000 });
      const groups = setLibraryTracks(result);
      setAlbums(groups);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openAlbum = useCallback(
    (group: AlbumGroup) => {
      router.push(`/album/${encodeURIComponent(group.key)}` as never);
    },
    [router],
  );

  const rows = useMemo(() => buildRows(albums), [albums]);

  return (
    <View style={styles.container}>
      {status === 'loading' || status === 'checking' ? <ActivityIndicator color="#fff" style={styles.spinner} /> : null}

      {status === 'denied' ? (
        <Pressable style={styles.button} onPress={() => void load()}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </Pressable>
      ) : null}

      {status === 'error' ? <Text style={styles.error}>{error}</Text> : null}

      {status === 'ready' ? (
        <FlatList
          style={styles.list}
          data={rows}
          keyExtractor={(r) => r.key}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(300).delay((index % 8) * 40)} style={styles.row}>
              {item.kind === 'pair' ? (
                <>
                  <AlbumTile group={item.left} onPress={() => openAlbum(item.left)} />
                  <AlbumTile group={item.right} onPress={() => openAlbum(item.right)} />
                </>
              ) : (
                <AlbumTile group={item.item} onPress={() => openAlbum(item.item)} fullWidth />
              )}
            </Animated.View>
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 12, paddingHorizontal: 12 },
  spinner: { marginTop: 24 },
  button: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#1f6feb', borderRadius: 8, alignSelf: 'flex-start' },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#ff6b6b', marginTop: 16 },
  list: { flex: 1 },
  listContent: { paddingTop: 8 },
  row: { flexDirection: 'row' },
});
