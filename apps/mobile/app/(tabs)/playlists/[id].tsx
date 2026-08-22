import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ChevronLeft, Play } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Player } from '../../../modules/metalp3-player';
import type { Track } from '../../../modules/metalp3-media/src/MetalP3Media.types';
import BlurredBackdrop from '../../../src/components/BlurredBackdrop';
import ConfirmDeleteSheet from '../../../src/components/ConfirmDeleteSheet';
import { MINI_PLAYER_HEIGHT } from '../../../src/components/MiniPlayer';
import SwipeToDeleteRow, { useSwipeableRowRefs } from '../../../src/components/SwipeToDeleteRow';
import PlayShuffleButtons from '../../../src/components/PlayShuffleButtons';
import PlaylistMosaic from '../../../src/components/PlaylistMosaic';
import { deleteTracksOrError } from '../../../src/lib/delete-tracks';
import { useConfirmDelete } from '../../../src/lib/useConfirmDelete';
import { formatAlbumDuration, formatTrackDuration } from '../../../src/lib/group-tracks-by-album';
import { getLibraryTracks, subscribe as subscribeLibrary } from '../../../src/lib/library-cache';
import {
  Playlist,
  getActivePlaylistId,
  getPlaylist,
  loadPlaylists,
  setActivePlaylistId,
  setPlaylistTracks,
  subscribe as subscribePlaylists,
} from '../../../src/lib/playlist-store';
import { resolvePlaylistTracks } from '../../../src/lib/start-playlist';
import { startQueue, startShuffled } from '../../../src/lib/start-queue';
import { toQueueItem } from '../../../src/lib/to-queue-item';
import { tw } from '../../../src/lib/tw';
import { useTrackArtwork } from '../../../src/lib/useTrackArtwork';
import { useNowPlayingState } from '../../../src/lib/useNowPlayingState';
import { useArtworkTheme } from '../../../src/theme/useArtworkTheme';

// 48px artwork + py-2.5
const PLAYLIST_ROW_HEIGHT = 68;

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
  const { refForRow, closeRow } = useSwipeableRowRefs();
  const deleteFlow = useConfirmDelete<Track>({
    performDelete: (track) => deleteTracksOrError([track]),
    onCancel: (track) => closeRow(track.id),
  });

  const nowPlaying = useNowPlayingState();
  const playingTrackId = nowPlaying?.current?.id ?? null;
  const hasMiniPlayer = !!nowPlaying?.current;
  const listBottomPad = hasMiniPlayer
    ? insets.bottom + 24 + MINI_PLAYER_HEIGHT + 16
    : insets.bottom + 24;

  const themeSeedUri = useMemo(
    () =>
      playlist
        ? resolvePlaylistTracks(playlist, getLibraryTracks())[0]?.uri ?? null
        : null,
    [playlist],
  );
  const theme = useArtworkTheme(themeSeedUri);

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
    setStartError(null);
    const result = await startQueue(tracks, index);
    if (!result.ok) {
      setStartError(result.message);
      return;
    }
    if (playlist) setActivePlaylistId(playlist.id);
    router.push('/(tabs)/player' as never);
  };

  const onDragEnd = useCallback(
    ({ data }: { data: Track[] }) => {
      if (!playlist) return;
      const reorderedVisibleIds = data.map((t) => t.id);
      const visibleSet = new Set(reorderedVisibleIds);
      let cursor = 0;
      const next = playlist.trackIds.map((id) => {
        if (!visibleSet.has(id)) return id;
        const replacement = reorderedVisibleIds[cursor];
        cursor += 1;
        return replacement;
      });
      const same =
        next.length === playlist.trackIds.length
        && next.every((id, i) => id === playlist.trackIds[i]);
      if (same) return;
      void setPlaylistTracks(playlist.id, next);
    },
    [playlist],
  );

  const playShuffled = async () => {
    if (tracks.length === 0) return;
    setStartError(null);
    const result = await startShuffled(tracks);
    if (!result.ok) {
      setStartError(result.message);
      return;
    }
    if (playlist) setActivePlaylistId(playlist.id);
    router.push('/(tabs)/player' as never);
  };

  if (!loading && !playlist) {
    return (
      <View style={tw`flex-1 bg-black`}>
        <DetailHeader
          insetTop={insets.top}
          title="Playlist"
          onBack={() => router.back()}
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
      <Animated.View
        entering={FadeIn.duration(600)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      >
        <BlurredBackdrop />
      </Animated.View>
      <DetailHeader
        insetTop={insets.top}
        title={playlist?.name ?? 'Playlist'}
        onBack={() => router.back()}
      />

      <DraggableFlatList<Track>
        data={tracks}
        keyExtractor={(t) => t.id}
        onDragEnd={onDragEnd}
        activationDistance={12}
        contentContainerStyle={{ paddingBottom: listBottomPad }}
        ListHeaderComponent={
          <View style={[tw`px-4 pb-6 items-center`, { paddingTop: insets.top + 72 }]}>
            <View
              style={[
                tw`w-[220px] h-[220px] rounded-lg overflow-hidden bg-[#222] mb-4`,
                { boxShadow: '0 6px 10px rgba(0, 0, 0, 0.5)' },
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
            <PlayShuffleButtons
              theme={theme}
              disabled={tracks.length === 0}
              onPlay={() => void playFrom(0)}
              onShuffle={() => void playShuffled()}
              subject="playlist"
              testIDPrefix="playlist-detail"
              style={tw`mt-4`}
            />
          </View>
        }
        ListEmptyComponent={
          <Text style={tw`text-[#aaa] text-center mt-6 px-6`} testID="playlist-detail-empty">
            {playlist?.trackIds.length
              ? 'None of these tracks are in the library yet. Open Library to scan, or edit the playlist.'
              : 'This playlist is empty. Long-press a track in the library to add one.'}
          </Text>
        }
        renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<Track>) => (
          <ScaleDecorator>
            <SwipeToDeleteRow
              ref={refForRow(item.id)}
              testID={`playlist-detail-track-swipe-${item.id}`}
              rowHeight={PLAYLIST_ROW_HEIGHT}
              onDelete={() => deleteFlow.request(item)}
              deleteTestID={`playlist-detail-track-delete-action-${item.id}`}
              deleteAccessibilityLabel={`Delete ${item.title ?? 'track'}`}
              enabled={!isActive}
            >
              <PlaylistTrackRow
                track={item}
                isPlaying={playingTrackId === item.id}
                accent={theme.accent}
                isActive={isActive}
                onPress={() => {
                  const idx = getIndex();
                  if (typeof idx === 'number') void playFrom(idx);
                }}
                onLongPress={drag}
              />
            </SwipeToDeleteRow>
          </ScaleDecorator>
        )}
      />

      <ConfirmDeleteSheet
        {...deleteFlow.sheetProps}
        title="Delete track?"
        message={
          deleteFlow.pending
            ? `"${deleteFlow.pending.title ?? 'This track'}" will be permanently removed from your device.`
            : ''
        }
        confirmLabel="Delete"
      />
    </View>
  );
}

interface DetailHeaderProps {
  insetTop: number;
  title: string;
  onBack: () => void;
}

function DetailHeader({ insetTop, title, onBack }: DetailHeaderProps) {
  return (
    <View
      style={[
        tw`absolute left-0 right-0 z-10 flex-row items-center px-1`,
        { top: insetTop, height: 48 },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onBack}
        hitSlop={12}
        style={tw`w-12 h-12 items-center justify-center`}
        testID="playlist-detail-back"
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <ChevronLeft size={28} color="#fff" strokeWidth={2.25} strokeLinecap="square" />
      </Pressable>
      <Text
        style={tw`flex-1 text-white text-base font-semibold text-center px-2`}
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  );
}

interface PlaylistTrackRowProps {
  track: Track;
  isPlaying: boolean;
  accent: string;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function PlaylistTrackRow({
  track,
  isPlaying,
  accent,
  isActive,
  onPress,
  onLongPress,
}: PlaylistTrackRowProps) {
  const artUri = useTrackArtwork(track.uri);
  const subtitleParts = [track.artist ?? track.albumArtist, track.album].filter(Boolean);
  const subtitle = subtitleParts.join(' — ');

  return (
    <Pressable
      style={[
        tw`flex-row items-center py-2.5 px-4 border-b border-white/[0.08]`,
        {
          borderBottomWidth: StyleSheet.hairlineWidth,
          backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={250}
      disabled={isActive}
      testID={`playlist-detail-track-${track.id}`}
      accessibilityRole="button"
      accessibilityLabel={track.title ?? 'Unknown title'}
    >
      <View
        style={tw`w-12 h-12 rounded overflow-hidden bg-[#222] mr-3`}
        testID={`playlist-detail-track-art-${track.id}`}
      >
        {artUri ? (
          <Image
            source={{ uri: artUri }}
            style={tw`w-full h-full`}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={artUri}
            transition={120}
          />
        ) : null}
      </View>
      <View style={tw`flex-1 pr-2`}>
        <Text
          style={[
            tw`text-[15px]`,
            isPlaying ? { color: accent, fontWeight: '600' } : { color: '#fff' },
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
          <Play size={14} color={accent} fill={accent} />
        </View>
      ) : null}
      <Text style={[tw`text-[#bbb] text-[13px]`, { fontVariant: ['tabular-nums'] }]}>
        {formatTrackDuration(track.durationMs)}
      </Text>
    </Pressable>
  );
}

