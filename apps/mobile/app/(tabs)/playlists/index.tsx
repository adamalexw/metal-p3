import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfirmDeleteSheet from '../../../src/components/ConfirmDeleteSheet';
import ContextMenuSheet from '../../../src/components/ContextMenuSheet';
import LibraryHeader, { LibraryHeaderSpacer } from '../../../src/components/LibraryHeader';
import BlurredBackdrop from '../../../src/components/BlurredBackdrop';
import { MINI_PLAYER_HEIGHT } from '../../../src/components/MiniPlayer';
import PlaylistTile from '../../../src/components/PlaylistTile';
import {
  Playlist,
  deletePlaylist,
  getPlaylists,
  loadPlaylists,
  subscribe,
} from '../../../src/lib/playlist-store';
import { startPlaylist } from '../../../src/lib/start-playlist';
import { tw } from '../../../src/lib/tw';
import { useNowPlayingState } from '../../../src/lib/useNowPlayingState';

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    void loadPlaylists().then((p) => setPlaylists([...p]));
    return subscribe(() => setPlaylists([...getPlaylists()]));
  }, []);

  const openPlaylist = useCallback(
    async (playlist: Playlist) => {
      setStartError(null);
      const result = await startPlaylist(playlist.id);
      if (result.ok) {
        router.push('/(tabs)/player' as never);
        return;
      }
      setStartError(messageForReason(result.reason, playlist.name, result.message));
    },
    [router],
  );

  const handleLongPressPlaylist = useCallback((playlist: Playlist) => {
    setContextPlaylist(playlist);
  }, []);

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
                  key: 'edit',
                  label: 'Edit playlist',
                  icon: Pencil,
                  onPress: () => {
                    const id = contextPlaylist.id;
                    setContextPlaylist(null);
                    router.push(`/(tabs)/playlists/${encodeURIComponent(id)}/edit` as never);
                  },
                  testID: `playlist-context-edit-${contextPlaylist.id}`,
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
            ? `"${pendingDelete.name}" will be removed. The tracks in it will not be deleted.`
            : ''
        }
        confirmLabel="Delete"
        busy={busy}
        error={error}
        onConfirm={() => void confirmDelete()}
        onCancel={cancelDelete}
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
