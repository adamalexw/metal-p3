import { BlurView } from 'expo-blur';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Play, Shuffle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Media } from '../../modules/metalp3-media';
import { MetalP3Player } from '../../modules/metalp3-player';
import { MINI_PLAYER_HEIGHT } from '../../src/components/MiniPlayer';
import { toFlagEmoji } from '../../src/lib/country-flag';
import { formatAlbumDuration, formatTrackDuration } from '../../src/lib/group-tracks-by-album';
import { findAlbumGroup, subscribe as subscribeLibrary } from '../../src/lib/library-cache';
import { shuffled } from '../../src/lib/shuffle';
import { toQueueItem } from '../../src/lib/to-queue-item';
import AddToPlaylistSheet from '../../src/components/AddToPlaylistSheet';
import ConfirmDeleteSheet from '../../src/components/ConfirmDeleteSheet';
import { deleteTracksAndPropagate } from '../../src/lib/delete-tracks';
import { tw } from '../../src/lib/tw';
import { useNowPlayingState } from '../../src/lib/useNowPlayingState';
import { useTrackExtras } from '../../src/lib/useTrackExtras';
import { prefetchArtworkTheme, useArtworkTheme } from '../../src/theme/useArtworkTheme';
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
  const extras = useTrackExtras(group?.representativeUri ?? null);
  const albumUrl = extras.metalArchivesUrl;
  const flag = toFlagEmoji(extras.country);
  const playingTrackId = nowPlaying?.current?.id ?? null;
  const hasMiniPlayer = !!nowPlaying?.current;
  const listBottomPad = hasMiniPlayer ? insets.bottom + 24 + MINI_PLAYER_HEIGHT + 16 : insets.bottom + 8;
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
      <View style={tw`flex-1 bg-black`}>
        <Stack.Screen options={{ title: 'Album', headerShown: true, headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }} />
        <Text style={tw`text-[#ff6b6b] text-center mt-12 px-6`} testID="album-missing">
          Album not found. Return to the library and try again.
        </Text>
      </View>
    );
  }

  const meta = `${group.trackCount} ${group.trackCount === 1 ? 'song' : 'songs'} · ${formatAlbumDuration(group.totalDurationMs)}`;

  const playFrom = async (index: number) => {
    prefetchArtworkTheme(group.tracks[index]?.uri);
    try {
      await MetalP3Player.setShuffle(false);
      await MetalP3Player.setQueueAsync(group.tracks.map(toQueueItem), index, 0);
      await MetalP3Player.play();
    } catch (err) {
      console.warn('AlbumDetailScreen: failed to start playback', err);
      return;
    }
    router.push('/(tabs)/player' as never);
  };

  const playShuffled = async () => {
    const ordered = shuffled(group.tracks);
    prefetchArtworkTheme(ordered[0]?.uri);
    try {
      await MetalP3Player.setQueueAsync(ordered.map(toQueueItem), 0, 0);
      await MetalP3Player.setShuffle(true);
      await MetalP3Player.play();
    } catch (err) {
      console.warn('AlbumDetailScreen: failed to start shuffle playback', err);
      return;
    }
    router.push('/(tabs)/player' as never);
  };

  const requestDeleteTrack = (track: Track) => {
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
    <View style={tw`flex-1 bg-black`}>
      <Stack.Screen
        options={{
          title: group.albumName,
          headerShown: true,
          headerTintColor: theme.foreground,
          headerTitleAlign: 'center',
          headerTitle: () => (
            <View style={tw`items-center`} testID="album-detail-header-title">
              <Text
                style={[tw`text-base font-semibold`, { color: theme.foreground }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {group.albumName}
              </Text>
              <Text
                style={[tw`text-xs`, { color: theme.mutedForeground }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {group.bandName}
              </Text>
            </View>
          ),
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackground: () =>
            artUri ? (
              <View style={StyleSheet.absoluteFill}>
                <Image
                  source={{ uri: artUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                  blurRadius={10}
                />
                <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, tw`bg-black/30`]} />
              </View>
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]} />
            ),
        }}
      />

      {artUri ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="album-detail-backdrop">
          <Image source={{ uri: artUri }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={10} />
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, tw`bg-black/30`]} />
        </View>
      ) : null}

      <FlatList<Track>
        data={group.tracks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: listBottomPad }}
        ListHeaderComponent={
          <View style={[tw`px-4 pb-6 items-center`, { paddingTop: insets.top + 88 }]}>
            <View
              style={tw`w-[220px] h-[220px] rounded-lg overflow-hidden bg-[#222] mb-4`}
              testID="album-detail-artwork"
            >
              {artUri ? (
                <Image source={{ uri: artUri }} style={tw`w-full h-full`} resizeMode="cover" />
              ) : (
                <View style={tw`w-full h-full bg-[#222]`} />
              )}
            </View>
            {albumUrl ? (
              <Text
                style={[
                  tw`text-[22px] font-bold text-center underline`,
                  { color: theme.accent },
                ]}
                numberOfLines={2}
                onPress={() => void Linking.openURL(albumUrl)}
                accessibilityRole="link"
                accessibilityLabel="Open Metal Archives page"
                testID="album-detail-name-link"
              >
                {group.albumName}
              </Text>
            ) : (
              <Text
                style={[tw`text-[22px] font-bold text-center`, { color: theme.foreground }]}
                numberOfLines={2}
                testID="album-detail-name"
              >
                {group.albumName}
              </Text>
            )}
            <Text
              style={[tw`text-base mt-1 text-center`, { color: theme.foreground }]}
              numberOfLines={1}
              testID="album-detail-band"
            >
              {group.bandName}
            </Text>
            {group.genre || flag ? (
              <Text
                style={[tw`text-[13px] mt-1 text-center`, { color: theme.mutedForeground }]}
                numberOfLines={1}
                testID="album-detail-genre"
              >
                {flag ? `${flag}  ` : ''}
                {group.genre ?? ''}
              </Text>
            ) : null}
            <Text style={[tw`text-[13px] mt-1.5 text-center`, { color: theme.mutedForeground }]}>
              {meta}
            </Text>
            <View style={tw`flex-row gap-3 mt-4`}>
              <Pressable
                style={[
                  tw`flex-row items-center justify-center gap-2 py-2.5 px-5 rounded-full min-w-[130px]`,
                  { backgroundColor: theme.accent },
                ]}
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
                <Text
                  style={[tw`text-sm font-bold tracking-[0.4px]`, { color: theme.accentForeground }]}
                >
                  Play
                </Text>
              </Pressable>
              <Pressable
                style={[
                  tw`flex-row items-center justify-center gap-2 py-2.5 px-5 rounded-full min-w-[130px]`,
                  {
                    borderWidth: 1.5,
                    backgroundColor: theme.surface,
                    borderColor: theme.accent,
                  },
                ]}
                onPress={() => void playShuffled()}
                testID="album-detail-shuffle"
                accessibilityRole="button"
                accessibilityLabel="Shuffle album"
              >
                <Shuffle
                  size={20}
                  color={theme.accent}
                  strokeWidth={2.5}
                  strokeLinecap="square"
                />
                <Text style={[tw`text-sm font-bold tracking-[0.4px]`, { color: theme.accent }]}>
                  Shuffle
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const isPlaying = playingTrackId !== null && playingTrackId === item.id;
          const row = (
            <Pressable
              style={[
                tw`flex-row items-center py-3 px-4 border-b border-white/[0.08]`,
                { borderBottomWidth: StyleSheet.hairlineWidth },
              ]}
              onPress={() => void playFrom(index)}
              onLongPress={() => setLongPressedTrackId(item.id)}
              testID={`album-track-${item.id}`}
            >
              {isPlaying ? (
                <View
                  style={tw`w-8 items-start`}
                  testID={`album-track-playing-indicator-${item.id}`}
                >
                  <Play size={14} color={theme.accent} fill={theme.accent} />
                </View>
              ) : (
                <Text
                  style={[tw`text-[#bbb] text-sm w-8`, { fontVariant: ['tabular-nums'] }]}
                >
                  {formatTrackNumber(item, index)}
                </Text>
              )}
              <View style={tw`flex-1 px-2`}>
                <Text
                  style={[tw`text-white text-[15px]`, isPlaying && { color: theme.accent }]}
                  numberOfLines={1}
                >
                  {item.title ?? 'Unknown title'}
                </Text>
              </View>
              <Text style={[tw`text-[#bbb] text-[13px]`, { fontVariant: ['tabular-nums'] }]}>
                {formatTrackDuration(item.durationMs)}
              </Text>
            </Pressable>
          );
          return (
            <Swipeable
              ref={(ref) => {
                if (ref) swipeableRefs.current.set(item.id, ref);
                else swipeableRefs.current.delete(item.id);
              }}
              testID={`album-track-swipe-${item.id}`}
              renderRightActions={() => (
                <Pressable
                  style={tw`bg-[#ff3b30] justify-center items-center px-6 min-w-[96px]`}
                  onPress={() => requestDeleteTrack(item)}
                  testID={`album-track-delete-action-${item.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.title ?? 'track'}`}
                >
                  <Text style={tw`text-white text-sm font-bold tracking-[0.4px]`}>Delete</Text>
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
