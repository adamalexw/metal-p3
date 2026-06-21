import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { ListPlus, Play, Shuffle, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Player } from '../../../modules/metalp3-player';
import ConfirmDeleteSheet from '../../../src/components/ConfirmDeleteSheet';
import ContextMenuSheet from '../../../src/components/ContextMenuSheet';
import LibraryHeader, { LibraryHeaderSpacer } from '../../../src/components/LibraryHeader';
import BlurredBackdrop from '../../../src/components/BlurredBackdrop';
import { MINI_PLAYER_HEIGHT } from '../../../src/components/MiniPlayer';
import PlaylistTile from '../../../src/components/PlaylistTile';
import { deleteTracksAndPropagate } from '../../../src/lib/delete-tracks';
import { getLibraryTracks } from '../../../src/lib/library-cache';
import {
  Playlist,
  deletePlaylist,
  getPlaylists,
  loadPlaylists,
  subscribe,
} from '../../../src/lib/playlist-store';
import { shuffled } from '../../../src/lib/shuffle';
import { resolvePlaylistTracks, startPlaylist } from '../../../src/lib/start-playlist';
import { toQueueItem } from '../../../src/lib/to-queue-item';
import { tw } from '../../../src/lib/tw';
import { useNowPlayingState } from '../../../src/lib/useNowPlayingState';
import { prefetchArtworkTheme } from '../../../src/theme/useArtworkTheme';

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList<Playlist>);

const keyExtractor = (playlist: Playlist) => playlist.id;

function formatPlaylistStats(playlists: Playlist[]): string | null {
  if (playlists.length === 0) return null;
  const total = playlists.reduce((sum, p) => sum + p.trackIds.length, 0);
  return `${playlists.length} ${playlists.length === 1 ? 'playlist' : 'playlists'} · ${total} ${total === 1 ? 'track' : 'tracks'}`;
}

export default function PlaylistsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const nowPlaying = useNowPlayingState();
  const miniPlayerPad = nowPlaying?.current ? MINI_PLAYER_HEIGHT + 16 : 0;

  const [playlists, setPlaylists] = useState<Playlist[]>(() => getPlaylists());
  const [contextPlaylist, setContextPlaylist] = useState<Playlist | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Playlist | null>(null);
  const [pendingDeleteWithFiles, setPendingDeleteWithFiles] = useState<Playlist | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    void loadPlaylists().then((p) => setPlaylists([...p]));
    return subscribe(() => setPlaylists([...getPlaylists()]));
  }, []);

  const openPlaylist = useCallback(
    (playlist: Playlist) => {
      setStartError(null);
      router.push(`/(tabs)/playlists/${encodeURIComponent(playlist.id)}` as never);
    },
    [router],
  );

  const handleLongPressPlaylist = useCallback((playlist: Playlist) => {
    setContextPlaylist(playlist);
  }, []);

  const playPlaylist = async (playlist: Playlist) => {
    setStartError(null);
    try {
      await MetalP3Player.setShuffle(false);
    } catch (err) {
      console.warn('PlaylistsListScreen: failed to disable shuffle', err);
    }
    const result = await startPlaylist(playlist.id);
    if (result.ok) {
      router.push('/(tabs)/player' as never);
      return;
    }
    setStartError(messageForReason(result.reason, playlist.name, result.message));
  };

  const shufflePlaylist = async (playlist: Playlist) => {
    setStartError(null);
    const library = getLibraryTracks();
    if (library.length === 0) {
      setStartError(messageForReason('empty-library', playlist.name));
      return;
    }
    const tracks = resolvePlaylistTracks(playlist, library);
    if (tracks.length === 0) {
      setStartError(messageForReason('empty-playlist', playlist.name));
      return;
    }
    const ordered = shuffled(tracks);
    prefetchArtworkTheme(ordered[0]?.uri);
    try {
      await MetalP3Player.setQueueAsync(ordered.map(toQueueItem), 0, 0);
      await MetalP3Player.setShuffle(true);
      await MetalP3Player.play();
    } catch (err) {
      setStartError(messageForReason('error', playlist.name, err instanceof Error ? err.message : String(err)));
      return;
    }
    router.push('/(tabs)/player' as never);
  };

  const addPlaylistToQueue = async (playlist: Playlist) => {
    setStartError(null);
    const library = getLibraryTracks();
    if (library.length === 0) {
      setStartError(messageForReason('empty-library', playlist.name));
      return;
    }
    const tracks = resolvePlaylistTracks(playlist, library);
    if (tracks.length === 0) {
      setStartError(messageForReason('empty-playlist', playlist.name));
      return;
    }
    try {
      await MetalP3Player.addToQueueAsync(tracks.map(toQueueItem));
    } catch (err) {
      setStartError(messageForReason('error', playlist.name, err instanceof Error ? err.message : String(err)));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete || busy) return;
    setBusy(true);
    setError(null);
    try {
      await deletePlaylist(pendingDelete.id);
      setPendingDelete(null);
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  const cancelDelete = () => {
    if (busy) return;
    setPendingDelete(null);
    setError(null);
  };

  const askDeleteWithFiles = () => {
    if (!pendingDelete || busy) return;
    setPendingDeleteWithFiles(pendingDelete);
    setPendingDelete(null);
    setError(null);
  };

  const confirmDeleteWithFiles = async () => {
    if (!pendingDeleteWithFiles || busy) return;
    setBusy(true);
    setError(null);
    const playlist = pendingDeleteWithFiles;
    try {
      const tracks = resolvePlaylistTracks(playlist, getLibraryTracks());
      if (tracks.length > 0) {
        const outcome = await deleteTracksAndPropagate(tracks, 'album-folder');
        if (outcome.deletedIds.length === 0) {
          setError('File deletion was cancelled or failed.');
          setBusy(false);
          return;
        }
      }
      await deletePlaylist(playlist.id);
      setPendingDeleteWithFiles(null);
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  const cancelDeleteWithFiles = () => {
    if (busy) return;
    setPendingDeleteWithFiles(null);
    setError(null);
  };

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const renderItem = useCallback(
    ({ item, index }: { item: Playlist; index: number }) => (
      <PlaylistTile
        playlist={item}
        index={index}
        onPress={openPlaylist}
        onLongPress={handleLongPressPlaylist}
      />
    ),
    [openPlaylist, handleLongPressPlaylist],
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

      {startError ? (
        <Text
          style={tw`text-[#ff6b6b] text-center px-6 pt-3 pb-1`}
          testID="playlist-start-error"
        >
          {startError}
        </Text>
      ) : null}

      <AnimatedFlashList
        style={tw`flex-1`}
        data={playlists}
        keyExtractor={keyExtractor}
        numColumns={2}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={<LibraryHeaderSpacer topInset={insets.top} />}
        ListEmptyComponent={
          <Text style={tw`text-[#bbb] text-center px-6 pt-12`} testID="playlists-empty">
            No playlists yet. Long-press a track to add it to a new playlist.
          </Text>
        }
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 24 + miniPlayerPad }}
        renderItem={renderItem}
      />

      <LibraryHeader
        title="Playlists"
        stats={formatPlaylistStats(playlists)}
        topInset={insets.top}
        scrollY={scrollY}
      />

      <ContextMenuSheet
        visible={contextPlaylist !== null}
        title={contextPlaylist?.name}
        onClose={() => setContextPlaylist(null)}
        testID={contextPlaylist ? `playlist-row-context-menu-${contextPlaylist.id}` : undefined}
        items={
          contextPlaylist
            ? [
                {
                  key: 'play',
                  label: 'Play',
                  icon: Play,
                  onPress: () => void playPlaylist(contextPlaylist),
                  testID: `playlist-context-play-${contextPlaylist.id}`,
                },
                {
                  key: 'shuffle',
                  label: 'Shuffle',
                  icon: Shuffle,
                  onPress: () => void shufflePlaylist(contextPlaylist),
                  testID: `playlist-context-shuffle-${contextPlaylist.id}`,
                },
                {
                  key: 'add-to-queue',
                  label: 'Add to queue',
                  icon: ListPlus,
                  onPress: () => void addPlaylistToQueue(contextPlaylist),
                  testID: `playlist-context-add-to-queue-${contextPlaylist.id}`,
                },
                {
                  key: 'delete',
                  label: 'Delete playlist',
                  icon: Trash2,
                  destructive: true,
                  onPress: () => setPendingDelete(contextPlaylist),
                  testID: `playlist-context-delete-${contextPlaylist.id}`,
                },
              ]
            : []
        }
      />

      <ConfirmDeleteSheet
        visible={pendingDelete !== null}
        title="Delete playlist?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" will be removed. Choose whether to also delete the audio files in this playlist from your device.`
            : ''
        }
        confirmLabel="Delete playlist only"
        busy={busy}
        error={error}
        onConfirm={() => void confirmDelete()}
        onCancel={cancelDelete}
        secondaryConfirm={{
          label: 'Delete playlist + files',
          onPress: askDeleteWithFiles,
          testID: 'confirm-delete-with-files',
        }}
      />

      <ConfirmDeleteSheet
        visible={pendingDeleteWithFiles !== null}
        title="Delete files too?"
        message={
          pendingDeleteWithFiles
            ? `Every track in "${pendingDeleteWithFiles.name}" — and every other file in those tracks' folders (artwork, lyrics, sibling tracks) — will be deleted from your device. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete playlist + files"
        busy={busy}
        error={error}
        onConfirm={() => void confirmDeleteWithFiles()}
        onCancel={cancelDeleteWithFiles}
      />
    </View>
  );
}

function messageForReason(
  reason: 'missing' | 'empty-library' | 'empty-playlist' | 'error',
  playlistName: string,
  detail?: string,
): string {
  switch (reason) {
    case 'missing':
      return `"${playlistName}" not found.`;
    case 'empty-library':
      return 'Library not loaded — open Library first.';
    case 'empty-playlist':
      return `"${playlistName}" is empty.`;
    case 'error':
      return detail ?? 'Could not start playback.';
  }
}
