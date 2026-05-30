import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Media } from '../../modules/metalp3-media';
import AlbumTile from '../../src/components/AlbumTile';
import type { AlbumGroup } from '../../src/lib/group-tracks-by-album';
import { setLibraryTracks } from '../../src/lib/library-cache';

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
          data={albums}
          numColumns={2}
          keyExtractor={(g) => g.key}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => <AlbumTile group={item} onPress={() => openAlbum(item)} />}
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
  row: { gap: 0 },
});
