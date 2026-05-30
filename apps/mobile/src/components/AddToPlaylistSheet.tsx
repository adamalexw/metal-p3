import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  DuplicatePlaylistNameError,
  Playlist,
  addTrackToPlaylist,
  createPlaylist,
  getPlaylists,
  loadPlaylists,
  subscribe,
} from '../lib/playlist-store';

interface AddToPlaylistSheetProps {
  visible: boolean;
  trackId: string | null;
  onClose: () => void;
}

type Mode = 'list' | 'create';

export default function AddToPlaylistSheet({ visible, trackId, onClose }: AddToPlaylistSheetProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => getPlaylists());
  const [mode, setMode] = useState<Mode>('list');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadPlaylists().then((p) => setPlaylists([...p]));
    return subscribe(() => setPlaylists([...getPlaylists()]));
  }, []);

  useEffect(() => {
    if (!visible) {
      setMode('list');
      setNewName('');
      setError(null);
      setBusy(false);
    }
  }, [visible]);

  const trimmedName = newName.trim();
  const canCreate = trimmedName.length > 0 && !busy;

  const duplicate = useMemo(
    () => playlists.some((p) => p.name.toLowerCase() === trimmedName.toLowerCase()),
    [playlists, trimmedName],
  );

  const handlePick = async (playlistId: string) => {
    if (!trackId || busy) return;
    setBusy(true);
    try {
      await addTrackToPlaylist(playlistId, trackId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!trackId || !canCreate) return;
    if (duplicate) {
      setError(`A playlist named "${trimmedName}" already exists.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await createPlaylist(trimmedName);
      await addTrackToPlaylist(created.id, trackId);
      onClose();
    } catch (err) {
      if (err instanceof DuplicatePlaylistNameError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID="add-to-playlist-sheet"
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
          pointerEvents="box-none"
        >
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.title}>Add to playlist</Text>

            {mode === 'list' ? (
              <>
                <FlatList
                  data={playlists}
                  keyExtractor={(p) => p.id}
                  ListEmptyComponent={
                    <Text style={styles.empty}>No playlists yet. Create one below.</Text>
                  }
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.row}
                      onPress={() => void handlePick(item.id)}
                      testID={`add-to-playlist-row-${item.id}`}
                    >
                      <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.rowMeta}>
                        {item.trackIds.length} {item.trackIds.length === 1 ? 'track' : 'tracks'}
                      </Text>
                    </Pressable>
                  )}
                  style={styles.list}
                />
                <Pressable
                  style={[styles.row, styles.newRow]}
                  onPress={() => setMode('create')}
                  testID="add-to-playlist-new"
                >
                  <Text style={styles.newRowLabel}>+ New playlist…</Text>
                </Pressable>
                {error ? <Text style={styles.error}>{error}</Text> : null}
              </>
            ) : (
              <>
                <TextInput
                  value={newName}
                  onChangeText={(text) => {
                    setNewName(text);
                    setError(null);
                  }}
                  placeholder="Playlist name"
                  placeholderTextColor="#666"
                  style={styles.input}
                  autoFocus
                  testID="add-to-playlist-input"
                  returnKeyType="done"
                  onSubmitEditing={() => void handleCreate()}
                />
                {duplicate && trimmedName.length > 0 ? (
                  <Text style={styles.error} testID="add-to-playlist-duplicate">
                    A playlist named &ldquo;{trimmedName}&rdquo; already exists.
                  </Text>
                ) : error ? (
                  <Text style={styles.error}>{error}</Text>
                ) : null}
                <View style={styles.buttonRow}>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => {
                      setMode('list');
                      setNewName('');
                      setError(null);
                    }}
                  >
                    <Text style={styles.cancelButtonLabel}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.createButton, (!canCreate || duplicate) && styles.buttonDisabled]}
                    disabled={!canCreate || duplicate}
                    onPress={() => void handleCreate()}
                    testID="add-to-playlist-create"
                  >
                    <Text style={styles.createButtonLabel}>Create</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  list: { maxHeight: 320 },
  empty: { color: '#888', textAlign: 'center', paddingVertical: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowName: { color: '#fff', fontSize: 15, flex: 1, paddingRight: 8 },
  rowMeta: { color: '#888', fontSize: 12 },
  newRow: { borderBottomWidth: 0, marginTop: 4 },
  newRowLabel: { color: '#1f6feb', fontSize: 15, fontWeight: '600' },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  error: { color: '#ff6b6b', marginTop: 4, marginBottom: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelButtonLabel: { color: '#aaa', fontSize: 15, fontWeight: '600' },
  createButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1f6feb',
  },
  createButtonLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  buttonDisabled: { opacity: 0.4 },
});
