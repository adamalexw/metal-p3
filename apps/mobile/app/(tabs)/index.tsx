import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { ListPlus, Play, Shuffle, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Media } from '../../modules/metalp3-media';
import { MetalP3Player } from '../../modules/metalp3-player';
import AlbumTile from '../../src/components/AlbumTile';
import ConfirmDeleteSheet from '../../src/components/ConfirmDeleteSheet';
import ContextMenuSheet from '../../src/components/ContextMenuSheet';
import LibraryHeader, {
  LibraryHeaderSpacer,
  formatLibraryStats,
} from '../../src/components/LibraryHeader';
import BlurredBackdrop from '../../src/components/BlurredBackdrop';
import { MINI_PLAYER_HEIGHT } from '../../src/components/MiniPlayer';
import { deleteTracksAndPropagate } from '../../src/lib/delete-tracks';
import type { AlbumGroup } from '../../src/lib/group-tracks-by-album';
import { setLibraryTracks, subscribe as subscribeLibrary, getAlbumGroups } from '../../src/lib/library-cache';
import { shuffled } from '../../src/lib/shuffle';
import { toQueueItem } from '../../src/lib/to-queue-item';
import { tw } from '../../src/lib/tw';
import { useNowPlayingState } from '../../src/lib/useNowPlayingState';
import { prefetchArtworkTheme } from '../../src/theme/useArtworkTheme';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList<AlbumGroup>);

const keyExtractor = (group: AlbumGroup) => group.key;

type Status = 'idle' | 'checking' | 'denied' | 'loading' | 'ready' | 'error';

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const nowPlaying = useNowPlayingState();
  const miniPlayerPad = nowPlaying?.current ? MINI_PLAYER_HEIGHT + 16 : 0;
  const [status, setStatus] = useState<Status>('idle');
  const [albums, setAlbums] = useState<AlbumGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [contextAlbum, setContextAlbum] = useState<AlbumGroup | null>(null);
  const [pendingDeleteAlbum, setPendingDeleteAlbum] = useState<AlbumGroup | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const scanInFlight = useRef(false);

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
      scanInFlight.current = true;
      const result = await MetalP3Media.scanAudioAsync({ minDurationMs: 10_000 });
      const groups = setLibraryTracks(result);
      setAlbums(groups);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    } finally {
      scanInFlight.current = false;
    }
  }, []);

  // Background rescan — runs when MediaStore changes (file transfer, scan) or
  // the app returns to the foreground. Doesn't flip status so the grid stays
  // mounted; the cache subscription pushes updated albums when tracks differ.
  const resync = useCallback(async () => {
    if (scanInFlight.current) return;
    if (!(await MetalP3Media.getPermissionsAsync()).granted) return;
    scanInFlight.current = true;
    try {
      const result = await MetalP3Media.scanAudioAsync({ minDurationMs: 10_000 });
      setLibraryTracks(result);
    } catch (err) {
      console.warn('LibraryScreen: resync failed', err);
    } finally {
      scanInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => subscribeLibrary(() => setAlbums(getAlbumGroups())), []);

  useEffect(() => {
    const sub = MetalP3Media.addMediaChangedListener(() => void resync());
    return () => sub.remove();
  }, [resync]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void resync();
    });
    return () => sub.remove();
  }, [resync]);

  const openAlbum = useCallback(
    (group: AlbumGroup) => {
      router.push(`/album/${encodeURIComponent(group.key)}` as never);
    },
    [router],
  );

  const handleLongPressAlbum = useCallback((group: AlbumGroup) => {
    setContextAlbum(group);
  }, []);

  const playAlbum = useCallback(
    async (group: AlbumGroup) => {
      prefetchArtworkTheme(group.tracks[0]?.uri);
      try {
        await MetalP3Player.setShuffle(false);
        await MetalP3Player.setQueueAsync(group.tracks.map(toQueueItem), 0, 0);
        await MetalP3Player.play();
      } catch (err) {
        console.warn('LibraryScreen: failed to start playback', err);
        return;
      }
      router.push('/(tabs)/player' as never);
    },
    [router],
  );

  const shuffleAlbum = useCallback(
    async (group: AlbumGroup) => {
      const ordered = shuffled(group.tracks);
      prefetchArtworkTheme(ordered[0]?.uri);
      try {
        await MetalP3Player.setQueueAsync(ordered.map(toQueueItem), 0, 0);
        await MetalP3Player.setShuffle(true);
        await MetalP3Player.play();
      } catch (err) {
        console.warn('LibraryScreen: failed to start shuffle playback', err);
        return;
      }
      router.push('/(tabs)/player' as never);
    },
    [router],
  );

  const addAlbumToQueue = useCallback(async (group: AlbumGroup) => {
    try {
      await MetalP3Player.addToQueueAsync(group.tracks.map(toQueueItem));
    } catch (err) {
      console.warn('LibraryScreen: failed to add album to queue', err);
    }
  }, []);

  const confirmDeleteAlbum = async () => {
    if (!pendingDeleteAlbum || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const outcome = await deleteTracksAndPropagate(pendingDeleteAlbum.tracks, 'album-folder');
      if (outcome.deletedIds.length === 0) {
        setDeleteError('Delete was cancelled or failed.');
        setDeleteBusy(false);
        return;
      }
      setPendingDeleteAlbum(null);
      setDeleteBusy(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
      setDeleteBusy(false);
    }
  };

  const cancelDeleteAlbum = () => {
    if (deleteBusy) return;
    setPendingDeleteAlbum(null);
    setDeleteError(null);
  };

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const renderItem = useCallback(
    ({ item, index }: { item: AlbumGroup; index: number }) => (
      <AlbumTile
        group={item}
        index={index}
        onPress={openAlbum}
        onLongPress={handleLongPressAlbum}
      />
    ),
    [openAlbum, handleLongPressAlbum],
  );

  return (
    <View style={tw`flex-1 bg-black`}>
      <Animated.View
        entering={FadeIn.duration(600)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      >
        <BlurredBackdrop />
      </Animated.View>

      {status === 'loading' || status === 'checking' ? (
        <ActivityIndicator color="#fff" style={[tw`mt-6`, { marginTop: insets.top + 24 }]} />
      ) : null}

      {status === 'denied' ? (
        <Pressable
          style={[tw`py-3 px-5 bg-[#1f6feb] rounded-lg self-start mx-3`, { marginTop: insets.top + 16 }]}
          onPress={() => void load()}
        >
          <Text style={tw`text-white font-semibold`}>Grant permission</Text>
        </Pressable>
      ) : null}

      {status === 'error' ? (
        <Text style={[tw`text-[#ff6b6b] mx-3`, { marginTop: insets.top + 16 }]}>{error}</Text>
      ) : null}

      {status === 'ready' ? (
        <>
          <AnimatedFlashList
            style={tw`flex-1`}
            data={albums}
            keyExtractor={keyExtractor}
            numColumns={2}
            onScroll={onScroll}
            scrollEventThrottle={16}
            ListHeaderComponent={<LibraryHeaderSpacer topInset={insets.top} />}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 24 + miniPlayerPad }}
            renderItem={renderItem}
          />
          <LibraryHeader
            title="Library"
            stats={formatLibraryStats(albums)}
            topInset={insets.top}
            scrollY={scrollY}
          />
        </>
      ) : null}

      <ContextMenuSheet
        visible={contextAlbum !== null}
        title={contextAlbum?.albumName}
        onClose={() => setContextAlbum(null)}
        testID={contextAlbum ? `album-tile-context-menu-${contextAlbum.key}` : undefined}
        items={
          contextAlbum
            ? [
                {
                  key: 'play',
                  label: 'Play',
                  icon: Play,
                  onPress: () => void playAlbum(contextAlbum),
                  testID: `album-context-play-${contextAlbum.key}`,
                },
                {
                  key: 'shuffle',
                  label: 'Shuffle',
                  icon: Shuffle,
                  onPress: () => void shuffleAlbum(contextAlbum),
                  testID: `album-context-shuffle-${contextAlbum.key}`,
                },
                {
                  key: 'add-to-queue',
                  label: 'Add to queue',
                  icon: ListPlus,
                  onPress: () => void addAlbumToQueue(contextAlbum),
                  testID: `album-context-add-to-queue-${contextAlbum.key}`,
                },
                {
                  key: 'delete',
                  label: 'Delete album',
                  icon: Trash2,
                  destructive: true,
                  onPress: () => setPendingDeleteAlbum(contextAlbum),
                  testID: `album-context-delete-${contextAlbum.key}`,
                },
              ]
            : []
        }
      />

      <ConfirmDeleteSheet
        visible={pendingDeleteAlbum !== null}
        title="Delete album?"
        message={
          pendingDeleteAlbum
            ? `All ${pendingDeleteAlbum.trackCount} ${
                pendingDeleteAlbum.trackCount === 1 ? 'track' : 'tracks'
              } in "${pendingDeleteAlbum.albumName}" will be permanently removed from your device.`
            : ''
        }
        confirmLabel="Delete"
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void confirmDeleteAlbum()}
        onCancel={cancelDeleteAlbum}
      />
    </View>
  );
}
