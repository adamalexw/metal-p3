import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MetalP3Player } from '../../../modules/metalp3-player';
import { getLibraryTracks } from '../../../src/lib/library-cache';
import {
  Playlist,
  getActivePlaylistId,
  getPlaylist,
  loadPlaylists,
  setActivePlaylistId,
  subscribe,
} from '../../../src/lib/playlist-store';
import { toQueueItem } from '../../../src/lib/to-queue-item';
import type { Track } from '../../../modules/metalp3-media/src/MetalP3Media.types';

type Status = 'loading' | 'missing' | 'empty-library' | 'empty-playlist' | 'started' | 'error';

function resolveTracks(playlist: Playlist, library: Track[]): Track[] {
  const byId = new Map(library.map((t) => [t.id, t]));
  const out: Track[] = [];
  for (const id of playlist.trackIds) {
    const found = byId.get(id);
    if (found) out.push(found);
  }
  return out;
}

export default function PlaylistDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const rawId = typeof params.id === 'string' ? params.id : '';
  const playlistId = decodeURIComponent(rawId);
  const [status, setStatus] = useState<Status>('loading');
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastTrackIdsRef = useRef<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadPlaylists();
      if (cancelled) return;
      const found = getPlaylist(playlistId);
      if (!found) {
        setStatus('missing');
        return;
      }
      setPlaylist(found);
      const library = getLibraryTracks();
      if (library.length === 0) {
        setStatus('empty-library');
        return;
      }
      const tracks = resolveTracks(found, library);
      if (tracks.length === 0) {
        setStatus('empty-playlist');
        return;
      }
      try {
        await MetalP3Player.setQueueAsync(tracks.map(toQueueItem), 0, 0);
        await MetalP3Player.play();
        setActivePlaylistId(found.id);
        lastTrackIdsRef.current = found.trackIds.join('|');
        setStatus('started');
        router.replace('/player' as never);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playlistId, router]);

  useEffect(() => {
    return subscribe(() => {
      if (getActivePlaylistId() !== playlistId) return;
      const updated = getPlaylist(playlistId);
      if (!updated) return;
      const signature = updated.trackIds.join('|');
      if (signature === lastTrackIdsRef.current) return;
      lastTrackIdsRef.current = signature;
      setPlaylist(updated);
      void (async () => {
        try {
          const library = getLibraryTracks();
          const tracks = resolveTracks(updated, library);
          if (tracks.length === 0) return;
          const state = await MetalP3Player.getStateAsync();
          const safeIndex = Math.min(Math.max(0, state.currentIndex), tracks.length - 1);
          await MetalP3Player.setQueueAsync(tracks.map(toQueueItem), safeIndex, state.positionMs);
        } catch (err) {
          console.warn('PlaylistDetailScreen: live update failed', err);
        }
      })();
    });
  }, [playlistId]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: playlist?.name ?? 'Playlist',
          headerShown: true,
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
        }}
      />
      {status === 'loading' || status === 'started' ? (
        <ActivityIndicator color="#fff" style={styles.spinner} />
      ) : null}
      {status === 'missing' ? (
        <Text style={styles.message} testID="playlist-missing">Playlist not found.</Text>
      ) : null}
      {status === 'empty-library' ? (
        <Text style={styles.message} testID="playlist-empty-library">
          Library not loaded — open Library first.
        </Text>
      ) : null}
      {status === 'empty-playlist' ? (
        <Text style={styles.message} testID="playlist-empty">
          This playlist is empty. Long-press a track to add one.
        </Text>
      ) : null}
      {status === 'error' ? (
        <Text style={styles.error} testID="playlist-error">{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  spinner: { marginTop: 48 },
  message: { color: '#aaa', textAlign: 'center', marginTop: 48, paddingHorizontal: 24 },
  error: { color: '#ff6b6b', textAlign: 'center', marginTop: 48, paddingHorizontal: 24 },
});
