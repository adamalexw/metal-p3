import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { MetalP3Player } from '../../../modules/metalp3-player';
import { getLibraryTracks } from '../../../src/lib/library-cache';
import {
  Playlist,
  getActivePlaylistId,
  getPlaylist,
  loadPlaylists,
  subscribe,
} from '../../../src/lib/playlist-store';
import { resolvePlaylistTracks, startPlaylist } from '../../../src/lib/start-playlist';
import { toQueueItem } from '../../../src/lib/to-queue-item';
import { tw } from '../../../src/lib/tw';

type Status = 'loading' | 'missing' | 'empty-library' | 'empty-playlist' | 'error';

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
      if (found) {
        setPlaylist(found);
        lastTrackIdsRef.current = found.trackIds.join('|');
      }

      const result = await startPlaylist(playlistId);
      if (cancelled) return;

      if (result.ok) {
        router.replace('/(tabs)/player' as never);
        return;
      }

      switch (result.reason) {
        case 'missing':
          setStatus('missing');
          break;
        case 'empty-library':
          setStatus('empty-library');
          break;
        case 'empty-playlist':
          setStatus('empty-playlist');
          break;
        case 'error':
          setError(result.message ?? 'Could not start playback.');
          setStatus('error');
          break;
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
          const tracks = resolvePlaylistTracks(updated, library);
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
    <View style={tw`flex-1 bg-black`}>
      <Stack.Screen
        options={{
          title: playlist?.name ?? 'Playlist',
          headerShown: true,
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
        }}
      />
      {status === 'loading' ? (
        <ActivityIndicator color="#fff" style={tw`mt-12`} />
      ) : null}
      {status === 'missing' ? (
        <Text style={tw`text-[#aaa] text-center mt-12 px-6`} testID="playlist-missing">
          Playlist not found.
        </Text>
      ) : null}
      {status === 'empty-library' ? (
        <Text style={tw`text-[#aaa] text-center mt-12 px-6`} testID="playlist-empty-library">
          Library not loaded — open Library first.
        </Text>
      ) : null}
      {status === 'empty-playlist' ? (
        <Text style={tw`text-[#aaa] text-center mt-12 px-6`} testID="playlist-empty">
          This playlist is empty. Long-press a track to add one.
        </Text>
      ) : null}
      {status === 'error' ? (
        <Text style={tw`text-[#ff6b6b] text-center mt-12 px-6`} testID="playlist-error">{error}</Text>
      ) : null}
    </View>
  );
}
