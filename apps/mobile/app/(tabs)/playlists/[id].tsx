import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pencil, Play, Shuffle } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Player } from '../../../modules/metalp3-player';
import type { Track } from '../../../modules/metalp3-media/src/MetalP3Media.types';
import { MINI_PLAYER_HEIGHT } from '../../../src/components/MiniPlayer';
import PlaylistMosaic from '../../../src/components/PlaylistMosaic';
import { formatAlbumDuration, formatTrackDuration } from '../../../src/lib/group-tracks-by-album';
import { getLibraryTracks, subscribe as subscribeLibrary } from '../../../src/lib/library-cache';
import {
  Playlist,
  getActivePlaylistId,
  getPlaylist,
  loadPlaylists,
  setActivePlaylistId,
  subscribe as subscribePlaylists,
} from '../../../src/lib/playlist-store';
import { shuffled } from '../../../src/lib/shuffle';
import { resolvePlaylistTracks } from '../../../src/lib/start-playlist';
import { toQueueItem } from '../../../src/lib/to-queue-item';
import { tw } from '../../../src/lib/tw';
import { useTrackArtwork } from '../../../src/lib/useTrackArtwork';
import { useNowPlayingState } from '../../../src/lib/useNowPlayingState';
import { prefetchArtworkTheme } from '../../../src/theme/useArtworkTheme';

const ACCENT = '#1f6feb';

export default function PlaylistDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rawId = typeof params.id === 'string' ? params.id : '';
  const playlistId = decodeURIComponent(rawId);

  const [, forceTick] = useState(0);
  const [playlist, setPlaylist] = useState<Playlist | null>(() => getPlaylist(playlistId) ?? null);
  const [loading, setLoading] = useState(!playlist);
  const [startError, setStartError] = useState<string | null>(null);
  const lastTrackIdsRef = useRef<string>(playlist ? playlist.trackIds.join('|') : '');

  const nowPlaying = useNowPlayingState();
  const playingTrackId = nowPlaying?.current?.id ?? null;
  const hasMiniPlayer = !!nowPlaying?.current;
  const listBottomPad = hasMiniPlayer
    ? insets.bottom + 24 + MINI_PLAYER_HEIGHT + 16
    : insets.bottom + 24;

  useEffect(() => {
    let cancelled = false;
    void loadPlaylists().then(() => {
      if (cancelled) return;
      const found = getPlaylist(playlistId) ?? null;
      setPlaylist(found);
      lastTrackIdsRef.current = found ? found.trackIds.join('|') : '';
      setLoading(false);
    });
    const unsubPlaylists = subscribePlaylists(() => {
      const updated = getPlaylist(playlistId) ?? null;
      setPlaylist(updated);
      const sig = updated ? updated.trackIds.join('|') : '';
      if (sig === lastTrackIdsRef.current) return;
      lastTrackIdsRef.current = sig;
      if (!updated || getActivePlaylistId() !== playlistId) return;
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
    const unsubLibrary = subscribeLibrary(() => forceTick((n) => n + 1));
    return () => {
      cancelled = true;
      unsubPlaylists();
      unsubLibrary();
    };
  }, [playlistId]);

  const tracks = useMemo<Track[]>(
    () => (playlist ? resolvePlaylistTracks(playlist, getLibraryTracks()) : []),
    [playlist],
  );

  const totalDurationMs = useMemo(
    () => tracks.reduce((sum, t) => sum + (t.durationMs ?? 0), 0),
    [tracks],
  );

  const playFrom = async (index: number) => {
    if (tracks.length === 0) return;
    prefetchArtworkTheme(tracks[index]?.uri);
    setStartError(null);
    try {
      await MetalP3Player.setShuffle(false);
      await MetalP3Player.setQueueAsync(tracks.map(toQueueItem), index, 0);
      await MetalP3Player.play();
      if (playlist) setActivePlaylistId(playlist.id);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : String(err));
      return;
    }
    router.push('/(tabs)/player' as never);
  };

  const playShuffled = async () => {
    if (tracks.length === 0) return;
    const ordered = shuffled(tracks);
    prefetchArtworkTheme(ordered[0]?.uri);
    setStartError(null);
    try {
      await MetalP3Player.setQueueAsync(ordered.map(toQueueItem), 0, 0);
      await MetalP3Player.setShuffle(true);
      await MetalP3Player.play();
      if (playlist) setActivePlaylistId(playlist.id);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : String(err));
      return;
    }
    router.push('/(tabs)/player' as never);
  };

  if (!loading && !playlist) {
    return (
      <View style={tw`flex-1 bg-black`}>
        <Stack.Screen
          options={{ title: 'Playlist', headerShown: true, headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }}
        />
        <Text style={tw`text-[#aaa] text-center mt-12 px-6`} testID="playlist-missing">
          Playlist not found.
        </Text>
      </View>
    );
  }

  const meta =
    tracks.length > 0
      ? `${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'} · ${formatAlbumDuration(totalDurationMs)}`
      : `${playlist?.trackIds.length ?? 0} ${(playlist?.trackIds.length ?? 0) === 1 ? 'track' : 'tracks'}`;

  return (
    <View style={tw`flex-1 bg-black`}>
      <Stack.Screen
        options={{
          title: playlist?.name ?? 'Playlist',
          headerShown: true,
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerRight: () =>
            playlist ? (
              <Pressable
                onPress={() =>
                  router.push(`/(tabs)/playlists/${encodeURIComponent(playlist.id)}/edit` as never)
                }
                style={tw`px-2 py-1`}
                testID="playlist-detail-edit"
                accessibilityRole="button"
                accessibilityLabel="Edit playlist"
              >
                <Pencil size={20} color="#fff" strokeWidth={2.25} strokeLinecap="square" />
              </Pressable>
            ) : null,
        }}
      />

      <FlatList<Track>
        data={tracks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: listBottomPad }}
        ListHeaderComponent={
          <View style={[tw`px-4 pb-6 items-center`, { paddingTop: insets.top + 24 }]}>
            <View
              style={[
                tw`w-[220px] h-[220px] rounded-lg overflow-hidden bg-[#222] mb-4`,
                {
                  shadowColor: '#000',
                  shadowOpacity: 0.5,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 6,
                },
              ]}
              testID="playlist-detail-artwork"
            >
              {playlist ? <PlaylistMosaic playlist={playlist} emptyIconSize={64} /> : null}
            </View>
            <Text
              style={tw`text-[22px] font-bold text-center text-white`}
              numberOfLines={2}
              testID="playlist-detail-name"
            >
              {playlist?.name ?? ''}
            </Text>
            <Text style={tw`text-[13px] mt-1.5 text-center text-[#bbb]`}>{meta}</Text>
            {startError ? (
              <Text style={tw`text-[#ff6b6b] text-center mt-2 px-2`} testID="playlist-detail-error">
                {startError}
              </Text>
            ) : null}
            <View style={tw`flex-row gap-3 mt-4`}>
              <Pressable
                style={[
                  tw`flex-row items-center justify-center gap-2 py-2.5 px-5 rounded-full min-w-[130px]`,
                  { backgroundColor: ACCENT, opacity: tracks.length === 0 ? 0.4 : 1 },
                ]}
                disabled={tracks.length === 0}
                onPress={() => void playFrom(0)}
                testID="playlist-detail-play"
                accessibilityRole="button"
                accessibilityLabel="Play playlist"
              >
                <Play
                  size={20}
                  color="#fff"
                  fill="#fff"
                  strokeWidth={2.5}
                  strokeLinecap="square"
                />
                <Text style={tw`text-sm font-bold tracking-[0.4px] text-white`}>Play</Text>
              </Pressable>
              <Pressable
                style={[
                  tw`flex-row items-center justify-center gap-2 py-2.5 px-5 rounded-full min-w-[130px]`,
                  {
                    borderWidth: 1.5,
                    backgroundColor: '#1a1a1a',
                    borderColor: ACCENT,
                    opacity: tracks.length === 0 ? 0.4 : 1,
                  },
                ]}
                disabled={tracks.length === 0}
                onPress={() => void playShuffled()}
                testID="playlist-detail-shuffle"
                accessibilityRole="button"
                accessibilityLabel="Shuffle playlist"
              >
                <Shuffle size={20} color={ACCENT} strokeWidth={2.5} strokeLinecap="square" />
                <Text style={[tw`text-sm font-bold tracking-[0.4px]`, { color: ACCENT }]}>
                  Shuffle
                </Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={tw`text-[#aaa] text-center mt-6 px-6`} testID="playlist-detail-empty">
            {playlist?.trackIds.length
              ? 'None of these tracks are in the library yet. Open Library to scan, or edit the playlist.'
              : 'This playlist is empty. Long-press a track in the library to add one.'}
          </Text>
        }
        renderItem={({ item, index }) => (
          <PlaylistTrackRow
            track={item}
            isPlaying={playingTrackId === item.id}
            onPress={() => void playFrom(index)}
          />
        )}
      />
    </View>
  );
}

interface PlaylistTrackRowProps {
  track: Track;
  isPlaying: boolean;
  onPress: () => void;
}

function PlaylistTrackRow({ track, isPlaying, onPress }: PlaylistTrackRowProps) {
  const artUri = useTrackArtwork(track.uri);
  const subtitleParts = [track.artist ?? track.albumArtist, track.album].filter(Boolean);
  const subtitle = subtitleParts.join(' — ');

  return (
    <Pressable
      style={[
        tw`flex-row items-center py-2.5 px-4 border-b border-white/[0.08]`,
        { borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
      onPress={onPress}
      testID={`playlist-detail-track-${track.id}`}
      accessibilityRole="button"
      accessibilityLabel={track.title ?? 'Unknown title'}
    >
      <View
        style={tw`w-12 h-12 rounded overflow-hidden bg-[#222] mr-3`}
        testID={`playlist-detail-track-art-${track.id}`}
      >
        {artUri ? (
          <Image source={{ uri: artUri }} style={tw`w-full h-full`} resizeMode="cover" />
        ) : null}
      </View>
      <View style={tw`flex-1 pr-2`}>
        <Text
          style={[
            tw`text-[15px]`,
            isPlaying ? { color: ACCENT, fontWeight: '600' } : { color: '#fff' },
          ]}
          numberOfLines={1}
        >
          {track.title ?? 'Unknown title'}
        </Text>
        {subtitle ? (
          <Text style={tw`text-[#bbb] text-xs mt-0.5`} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {isPlaying ? (
        <View
          style={tw`mr-2`}
          testID={`playlist-detail-track-playing-indicator-${track.id}`}
        >
          <Play size={14} color={ACCENT} fill={ACCENT} />
        </View>
      ) : null}
      <Text style={[tw`text-[#bbb] text-[13px]`, { fontVariant: ['tabular-nums'] }]}>
        {formatTrackDuration(track.durationMs)}
      </Text>
    </Pressable>
  );
}

