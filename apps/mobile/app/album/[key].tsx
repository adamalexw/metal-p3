import { BlurView } from 'expo-blur';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Play, Shuffle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Media } from '../../modules/metalp3-media';
import { MetalP3Player } from '../../modules/metalp3-player';
import { MINI_PLAYER_HEIGHT } from '../../src/components/MiniPlayer';
import { formatAlbumDuration } from '../../src/lib/group-tracks-by-album';
import { findAlbumGroup, subscribe as subscribeLibrary } from '../../src/lib/library-cache';
import { toQueueItem } from '../../src/lib/to-queue-item';
import AddToPlaylistSheet from '../../src/components/AddToPlaylistSheet';
import ConfirmDeleteSheet from '../../src/components/ConfirmDeleteSheet';
import { deleteTracksAndPropagate } from '../../src/lib/delete-tracks';
import { useNowPlayingState } from '../../src/lib/useNowPlayingState';
import { useArtworkTheme } from '../../src/theme/useArtworkTheme';
import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';

export default function AlbumDetailScreen() {
  const params = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const rawKey = typeof params.key === 'string' ? params.key : '';
  const albumKey = decodeURIComponent(rawKey);
  const [, forceTick] = useState(0);
  const group = findAlbumGroup(albumKey);
  const insets = useSafeAreaInsets();
  const nowPlaying = useNowPlayingState();
  const theme = useArtworkTheme(group?.representativeUri ?? null);
  const playingTrackId = nowPlaying?.current?.id ?? null;
  const miniPlayerPad = nowPlaying?.current ? MINI_PLAYER_HEIGHT + 16 : 0;
  const [artUri, setArtUri] = useState<string | null>(null);
  const [longPressedTrackId, setLongPressedTrackId] = useState<string | null>(null);
  const [pendingDeleteTrack, setPendingDeleteTrack] = useState<Track | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const swipeableRefs = useRef(new Map<string, Swipeable>());

  useEffect(() => subscribeLibrary(() => forceTick((n) => n + 1)), []);

  useEffect(() => {
    if (!group && rawKey) {
      router.back();
    }
  }, [group, rawKey, router]);

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
    try {
      await MetalP3Player.setShuffle(false);
      await MetalP3Player.setQueueAsync(group.tracks.map(toQueueItem), index, 0);
      await MetalP3Player.play();
    } catch (err) {
      console.warn('AlbumDetailScreen: failed to start playback', err);
      return;
    }
    router.push('/player' as never);
  };

  const playShuffled = async () => {
    try {
      await MetalP3Player.setShuffle(true);
      await MetalP3Player.setQueueAsync(group.tracks.map(toQueueItem), 0, 0);
      await MetalP3Player.play();
    } catch (err) {
      console.warn('AlbumDetailScreen: failed to start shuffle playback', err);
      return;
    }
    router.push('/player' as never);
  };

  const requestDeleteTrack = (track: Track) => {
    if (Platform.OS !== 'android') return;
    setDeleteError(null);
    setPendingDeleteTrack(track);
  };

  const confirmDeleteTrack = async () => {
    if (!pendingDeleteTrack || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const outcome = await deleteTracksAndPropagate([pendingDeleteTrack]);
      if (outcome.deletedIds.length === 0) {
        setDeleteError('Delete was cancelled or failed.');
        setDeleteBusy(false);
        return;
      }
      setPendingDeleteTrack(null);
      setDeleteBusy(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
      setDeleteBusy(false);
    }
  };

  const cancelDeleteTrack = () => {
    if (deleteBusy) return;
    const id = pendingDeleteTrack?.id;
    setPendingDeleteTrack(null);
    setDeleteError(null);
    if (id) {
      swipeableRefs.current.get(id)?.close();
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: group.albumName,
          headerShown: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: theme.foreground,
          headerTitleStyle: { color: theme.foreground },
          headerTransparent: true,
        }}
      />

      {artUri ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="album-detail-backdrop">
          <Image source={{ uri: artUri }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={Platform.OS === 'android' ? 10 : 0} />
          {Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, styles.webBackdropOverlay]} />
          ) : (
            <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <View style={[StyleSheet.absoluteFill, styles.darken]} />
        </View>
      ) : null}

      <FlatList
        data={group.tracks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 + miniPlayerPad }}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: insets.top + 56 }]}>
            <View style={styles.artwork} testID="album-detail-artwork">
              {artUri ? (
                <Image source={{ uri: artUri }} style={styles.artImage} resizeMode="cover" />
              ) : (
                <View style={styles.artPlaceholder} />
              )}
            </View>
            <Text
              style={[styles.albumName, { color: theme.foreground }]}
              numberOfLines={2}
              testID="album-detail-name"
            >
              {group.albumName}
            </Text>
            <Text
              style={[styles.bandName, { color: theme.foreground }]}
              numberOfLines={1}
              testID="album-detail-band"
            >
              {group.bandName}
            </Text>
            {group.genre ? (
              <Text
                style={[styles.genre, { color: theme.mutedForeground }]}
                numberOfLines={1}
                testID="album-detail-genre"
              >
                {group.genre}
              </Text>
            ) : null}
            <Text style={[styles.meta, { color: theme.mutedForeground }]}>{meta}</Text>
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionBtn, styles.actionPrimary, { backgroundColor: theme.accent }]}
                onPress={() => void playFrom(0)}
                testID="album-detail-play"
                accessibilityRole="button"
                accessibilityLabel="Play album"
              >
                <Play
                  size={20}
                  color={theme.accentForeground}
                  fill={theme.accentForeground}
                  strokeWidth={2.5}
                  strokeLinecap="square"
                />
                <Text style={[styles.actionLabel, { color: theme.accentForeground }]}>Play</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionBtn,
                  styles.actionSecondary,
                  { backgroundColor: theme.surface, borderColor: theme.foreground },
                ]}
                onPress={() => void playShuffled()}
                testID="album-detail-shuffle"
                accessibilityRole="button"
                accessibilityLabel="Shuffle album"
              >
                <Shuffle
                  size={20}
                  color={theme.foreground}
                  strokeWidth={2.5}
                  strokeLinecap="square"
                />
                <Text style={[styles.actionLabel, { color: theme.foreground }]}>Shuffle</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const isPlaying = playingTrackId !== null && playingTrackId === item.id;
          const canDelete = Platform.OS === 'android';
          const row = (
            <Pressable
              style={styles.row}
              onPress={() => void playFrom(index)}
              onLongPress={() => setLongPressedTrackId(item.id)}
              testID={`album-track-${item.id}`}
            >
              {isPlaying ? (
                <Text
                  style={[styles.trackNumber, styles.trackNumberPlaying, { color: theme.accent }]}
                  testID={`album-track-playing-indicator-${item.id}`}
                >
                  ▶
                </Text>
              ) : (
                <Text style={styles.trackNumber}>{formatTrackNumber(item, index)}</Text>
              )}
              <View style={styles.trackTextWrap}>
                <Text
                  style={[styles.trackTitle, isPlaying && { color: theme.accent }]}
                  numberOfLines={1}
                >
                  {item.title ?? 'Unknown title'}
                </Text>
              </View>
              <Text style={styles.trackDuration}>{formatTrackDuration(item.durationMs)}</Text>
            </Pressable>
          );
          if (!canDelete) return row;
          return (
            <Swipeable
              ref={(ref) => {
                if (ref) swipeableRefs.current.set(item.id, ref);
                else swipeableRefs.current.delete(item.id);
              }}
              testID={`album-track-swipe-${item.id}`}
              renderRightActions={() => (
                <Pressable
                  style={styles.deleteAction}
                  onPress={() => requestDeleteTrack(item)}
                  testID={`album-track-delete-action-${item.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.title ?? 'track'}`}
                >
                  <Text style={styles.deleteActionLabel}>Delete</Text>
                </Pressable>
              )}
              rightThreshold={48}
              overshootRight={false}
            >
              {row}
            </Swipeable>
          );
        }}
      />

      <AddToPlaylistSheet
        visible={longPressedTrackId !== null}
        trackId={longPressedTrackId}
        onClose={() => setLongPressedTrackId(null)}
      />

      <ConfirmDeleteSheet
        visible={pendingDeleteTrack !== null}
        title="Delete track?"
        message={
          pendingDeleteTrack
            ? `"${pendingDeleteTrack.title ?? 'This track'}" will be permanently removed from your device.`
            : ''
        }
        confirmLabel="Delete"
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void confirmDeleteTrack()}
        onCancel={cancelDeleteTrack}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  darken: { backgroundColor: 'rgba(0,0,0,0.3)' },
  webBackdropOverlay: { backgroundColor: 'rgba(0,0,0,0.3)' },
  header: { paddingHorizontal: 16, paddingBottom: 24, alignItems: 'center' },
  artwork: { width: 220, height: 220, borderRadius: 8, overflow: 'hidden', backgroundColor: '#222', marginBottom: 16 },
  artImage: { width: '100%', height: '100%' },
  artPlaceholder: { width: '100%', height: '100%', backgroundColor: '#222' },
  albumName: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  bandName: { fontSize: 16, marginTop: 4, textAlign: 'center' },
  genre: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  meta: { fontSize: 13, marginTop: 6, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    minWidth: 130,
  },
  actionPrimary: {},
  actionSecondary: { borderWidth: 1.5 },
  actionLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  trackNumber: { color: '#bbb', fontSize: 14, width: 32, fontVariant: ['tabular-nums'] },
  trackNumberPlaying: { fontSize: 14, fontWeight: '700', textAlign: 'left' },
  trackTextWrap: { flex: 1, paddingHorizontal: 8 },
  trackTitle: { color: '#fff', fontSize: 15 },
  trackDuration: { color: '#bbb', fontSize: 13, fontVariant: ['tabular-nums'] },
  missing: { color: '#ff6b6b', textAlign: 'center', marginTop: 48, paddingHorizontal: 24 },
  deleteAction: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    minWidth: 96,
  },
  deleteActionLabel: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.4 },
});
