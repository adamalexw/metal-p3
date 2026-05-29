import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MetalP3Media, type Track } from '../../modules/metalp3-media';
import { MetalP3Player } from '../../modules/metalp3-player';

type Status = 'idle' | 'checking' | 'denied' | 'loading' | 'ready' | 'error';

export default function LibraryScreen() {
  const [status, setStatus] = useState<Status>('idle');
  const [tracks, setTracks] = useState<Track[]>([]);
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
      setTracks(result);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const playFrom = useCallback(async (index: number) => {
    if (!tracks.length) return;
    await MetalP3Player.setQueueAsync(
      tracks.map((t) => ({
        id: t.id,
        uri: t.uri,
        title: t.title,
        artist: t.artist,
        album: t.album,
        albumArtist: t.albumArtist,
        durationMs: t.durationMs,
      })),
      index,
      0,
    );
    await MetalP3Player.play();
  }, [tracks]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading} testID="library-heading">
        Library
      </Text>
      <Text style={styles.subheading}>
        {status === 'ready' ? `${tracks.length} tracks` : status}
      </Text>

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
          data={tracks}
          keyExtractor={(t) => t.id}
          renderItem={({ item, index }) => (
            <Pressable style={styles.row} onPress={() => void playFrom(index)}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title ?? 'Unknown title'}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {[item.artist, item.album].filter(Boolean).join(' \u2014 ') || 'Unknown'}
              </Text>
            </Pressable>
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 24, paddingHorizontal: 16 },
  heading: { color: '#fff', fontSize: 28, fontWeight: '600' },
  subheading: { color: '#888', marginTop: 4, marginBottom: 12 },
  spinner: { marginTop: 24 },
  button: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#1f6feb', borderRadius: 8, alignSelf: 'flex-start' },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#ff6b6b', marginTop: 16 },
  list: { flex: 1 },
  row: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#222' },
  title: { color: '#fff', fontSize: 15 },
  meta: { color: '#888', fontSize: 13, marginTop: 2 },
});
