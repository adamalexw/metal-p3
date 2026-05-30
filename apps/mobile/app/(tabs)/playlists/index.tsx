import { useRouter } from 'expo-router';
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
    <View style={styles.container}>
      <FlatList
        data={playlists}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={
          <Text style={styles.empty} testID="playlists-empty">
            No playlists yet. Long-press a track to add it to a new playlist.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/playlists/${encodeURIComponent(item.id)}` as never)}
            onLongPress={() => setContextPlaylist(item)}
            testID={`playlist-row-${item.id}`}
          >
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.meta}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  empty: { color: '#888', textAlign: 'center', paddingHorizontal: 24, paddingTop: 48 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  name: { color: '#fff', fontSize: 16, flex: 1, paddingRight: 12 },
  meta: { color: '#888', fontSize: 13 },
});
