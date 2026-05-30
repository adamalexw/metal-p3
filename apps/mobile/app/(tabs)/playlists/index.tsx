import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfirmDeleteSheet from '../../../src/components/ConfirmDeleteSheet';
import ContextMenuSheet from '../../../src/components/ContextMenuSheet';
import {
  Playlist,
  deletePlaylist,
  getPlaylists,
  loadPlaylists,
  subscribe,
} from '../../../src/lib/playlist-store';
import { tw } from '../../../src/lib/tw';

export default function PlaylistsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [playlists, setPlaylists] = useState<Playlist[]>(() => getPlaylists());
  const [contextPlaylist, setContextPlaylist] = useState<Playlist | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Playlist | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadPlaylists().then((p) => setPlaylists([...p]));
    return subscribe(() => setPlaylists([...getPlaylists()]));
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

  return (
    <View style={tw`flex-1 bg-black`}>
      <FlatList
        data={playlists}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={
          <Text style={tw`text-[#888] text-center px-6 pt-12`} testID="playlists-empty">
            No playlists yet. Long-press a track to add it to a new playlist.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[
              tw`flex-row items-center justify-between py-4 px-4 border-b border-white/[0.08]`,
              { borderBottomWidth: StyleSheet.hairlineWidth },
            ]}
            onPress={() => router.push(`/playlists/${encodeURIComponent(item.id)}` as never)}
            onLongPress={() => setContextPlaylist(item)}
            testID={`playlist-row-${item.id}`}
          >
            <Text style={tw`text-white text-base flex-1 pr-3`} numberOfLines={1}>{item.name}</Text>
            <Text style={tw`text-[#888] text-[13px]`}>
              {item.trackIds.length} {item.trackIds.length === 1 ? 'track' : 'tracks'}
            </Text>
          </Pressable>
        )}
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
