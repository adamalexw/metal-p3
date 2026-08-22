import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Play, ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listBottomPad } from '../../src/components/MiniPlayer';
import { toFlagEmoji } from '../../src/lib/country-flag';
import { formatAlbumDuration, formatTrackDuration } from '../../src/lib/group-tracks-by-album';
import { useLibraryAlbumGroup } from '../../src/lib/library-cache';
import { startQueue, startShuffled } from '../../src/lib/start-queue';
import AddToPlaylistSheet from '../../src/components/AddToPlaylistSheet';
import ConfirmDeleteSheet from '../../src/components/ConfirmDeleteSheet';
import PlayShuffleButtons from '../../src/components/PlayShuffleButtons';
import SwipeToDeleteRow, { useSwipeableRowRefs } from '../../src/components/SwipeToDeleteRow';
import { deleteTracksOrError } from '../../src/lib/delete-tracks';
import { useConfirmDelete } from '../../src/lib/useConfirmDelete';
import { tw } from '../../src/lib/tw';
import { useNowPlayingState } from '../../src/lib/useNowPlayingState';
import { useTrackArtwork } from '../../src/lib/useTrackArtwork';
import { useTrackExtras } from '../../src/lib/useTrackExtras';
import { useArtworkTheme } from '../../src/theme/useArtworkTheme';
import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';

const TRACK_ROW_HEIGHT = 44;

export default function AlbumDetailScreen() {
  const params = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const rawKey = typeof params.key === 'string' ? params.key : '';
  const albumKey = decodeURIComponent(rawKey);
  const group = useLibraryAlbumGroup(albumKey);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const artSize = Math.max(160, Math.min(windowWidth - 48, 480));
  const nowPlaying = useNowPlayingState();
  const theme = useArtworkTheme(group?.representativeUri ?? null);
  const extras = useTrackExtras(group?.representativeUri ?? null);
  const albumUrl = extras.metalArchivesUrl;
  const flag = toFlagEmoji(extras.country);
  const playingTrackId = nowPlaying?.current?.id ?? null;
  const hasMiniPlayer = !!nowPlaying?.current;
  const artUri = useTrackArtwork(group?.representativeUri ?? null);
  const [longPressedTrackId, setLongPressedTrackId] = useState<string | null>(null);
  const { refForRow, closeRow } = useSwipeableRowRefs();
  const deleteFlow = useConfirmDelete<Track>({
    performDelete: (track) => deleteTracksOrError([track]),
    onCancel: (track) => closeRow(track.id),
  });

  useEffect(() => {
    if (!group && rawKey) {
      // The album no longer exists (e.g. it was just deleted). Always return to
      // the library rather than router.back(), which can land on a stale screen.
      router.replace('/(tabs)' as never);
    }
  }, [group, rawKey, router]);

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
    const result = await startQueue(group.tracks, index);
    if (!result.ok) {
      console.warn('AlbumDetailScreen: failed to start playback', result.message);
      return;
    }
    router.push('/(tabs)/player' as never);
  };

  const playShuffled = async () => {
    const result = await startShuffled(group.tracks);
    if (!result.ok) {
      console.warn('AlbumDetailScreen: failed to start shuffle playback', result.message);
      return;
    }
    router.push('/(tabs)/player' as never);
  };

  return (
    <View style={tw`flex-1 bg-black`}>
      <Stack.Screen options={{ headerShown: false }} />

      {artUri ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="album-detail-backdrop">
          <Image
            source={{ uri: artUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={10}
            cachePolicy="memory-disk"
            recyclingKey={artUri}
          />
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, tw`bg-black/30`]} />
        </View>
      ) : null}

      <Pressable
        style={[
          tw`absolute left-8 w-10 h-10 rounded-full bg-black/40 items-center justify-center z-50`,
          { top: insets.top + 20 }
        ]}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ChevronLeft size={24} color="#fff" />
      </Pressable>

      <FlatList<Track>
        data={group.tracks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: listBottomPad(insets.bottom, hasMiniPlayer, 8) }}
        ItemSeparatorComponent={TrackSeparator}
        ListHeaderComponent={
          <View style={[tw`pb-6 items-center`, { paddingTop: insets.top + 8 }]}>
            <View
              style={[
                tw`max-w-full rounded-[18px] overflow-hidden bg-[#222] mb-6`,
                {
                  width: artSize,
                  height: artSize,
                  boxShadow: '0 8px 18px rgba(0, 0, 0, 0.5)',
                },
              ]}
              testID="album-detail-artwork"
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
              ) : (
                <View style={tw`w-full h-full bg-[#222]`} />
              )}
            </View>

            <View style={tw`px-4 w-full items-center`}>
              {albumUrl ? (
                <Text
                  style={[
                    tw`text-xl font-bold text-center`,
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
                  style={[tw`text-xl font-bold text-center`, { color: theme.foreground }]}
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
                  style={[tw`text-sm mt-1.5 text-center`, { color: theme.mutedForeground }]}
                  numberOfLines={1}
                  testID="album-detail-genre"
                >
                  {flag ? `${flag}  ` : ''}
                  {group.genre ?? ''}
                </Text>
              ) : null}
              <Text style={[tw`text-sm mt-1 text-center`, { color: theme.mutedForeground }]}>
                {meta}
              </Text>
              
              <PlayShuffleButtons
                theme={theme}
                compact
                onPlay={() => void playFrom(0)}
                onShuffle={() => void playShuffled()}
                subject="album"
                testIDPrefix="album-detail"
                style={tw`w-full mt-5`}
              />
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const isPlaying = playingTrackId !== null && playingTrackId === item.id;
          const row = (
            <Pressable
              style={[tw`flex-row items-center px-4`, { height: TRACK_ROW_HEIGHT }]}
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
                  allowFontScaling={false}
                  style={[
                    tw`text-[#bbb] text-sm w-8`,
                    { fontVariant: ['tabular-nums'], includeFontPadding: false, textAlignVertical: 'center' },
                  ]}
                >
                  {formatTrackNumber(item, index)}
                </Text>
              )}
              <View style={tw`flex-1 px-2`}>
                <Text
                  allowFontScaling={false}
                  style={[
                    tw`text-white text-[15px]`,
                    { includeFontPadding: false, textAlignVertical: 'center' },
                    isPlaying && { color: theme.accent },
                  ]}
                  numberOfLines={1}
                >
                  {item.title ?? 'Unknown title'}
                </Text>
              </View>
              <Text
                allowFontScaling={false}
                style={[
                  tw`text-[#bbb] text-[13px]`,
                  { fontVariant: ['tabular-nums'], includeFontPadding: false, textAlignVertical: 'center' },
                ]}
              >
                {formatTrackDuration(item.durationMs)}
              </Text>
            </Pressable>
          );
          return (
            <SwipeToDeleteRow
              ref={refForRow(item.id)}
              testID={`album-track-swipe-${item.id}`}
              rowHeight={TRACK_ROW_HEIGHT}
              onDelete={() => deleteFlow.request(item)}
              deleteTestID={`album-track-delete-action-${item.id}`}
              deleteAccessibilityLabel={`Delete ${item.title ?? 'track'}`}
            >
              {row}
            </SwipeToDeleteRow>
          );
        }}
      />

      <AddToPlaylistSheet
        visible={longPressedTrackId !== null}
        trackId={longPressedTrackId}
        onClose={() => setLongPressedTrackId(null)}
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

function TrackSeparator() {
  return <View style={[tw`bg-white/[0.08]`, { height: StyleSheet.hairlineWidth }]} />;
}

function formatTrackNumber(track: Track, fallbackIndex: number): string {
  const n = track.trackNumber ?? fallbackIndex + 1;
  return String(n).padStart(2, '0');
}
