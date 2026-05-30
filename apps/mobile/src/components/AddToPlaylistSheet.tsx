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
import { tw } from '../lib/tw';

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

  const rowStyle = [
    tw`flex-row items-center justify-between py-[14px] px-2 border-b border-white/[0.08]`,
    { borderBottomWidth: StyleSheet.hairlineWidth },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID="add-to-playlist-sheet"
    >
      <Pressable style={tw`flex-1 bg-black/60`} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={tw`flex-1 justify-end`}
          pointerEvents="box-none"
        >
          <Pressable
            style={tw`bg-[#111] rounded-t-2xl px-4 pt-4 pb-6 max-h-[70%]`}
            onPress={() => undefined}
          >
            <Text style={tw`text-white text-lg font-bold mb-3`}>Add to playlist</Text>

            {mode === 'list' ? (
              <>
                <FlatList
                  data={playlists}
                  keyExtractor={(p) => p.id}
                  ListEmptyComponent={
                    <Text style={tw`text-[#888] text-center py-6`}>
                      No playlists yet. Create one below.
                    </Text>
                  }
                  renderItem={({ item }) => (
                    <Pressable
                      style={rowStyle}
                      onPress={() => void handlePick(item.id)}
                      testID={`add-to-playlist-row-${item.id}`}
                    >
                      <Text style={tw`text-white text-[15px] flex-1 pr-2`} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={tw`text-[#888] text-xs`}>
                        {item.trackIds.length} {item.trackIds.length === 1 ? 'track' : 'tracks'}
                      </Text>
                    </Pressable>
                  )}
                  style={tw`max-h-80`}
                />
                <Pressable
                  style={tw`flex-row items-center justify-between py-[14px] px-2 mt-1`}
                  onPress={() => setMode('create')}
                  testID="add-to-playlist-new"
                >
                  <Text style={tw`text-[#1f6feb] text-[15px] font-semibold`}>+ New playlist…</Text>
                </Pressable>
                {error ? <Text style={tw`text-[#ff6b6b] mt-1 mb-2`}>{error}</Text> : null}
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
                  style={tw`bg-[#222] text-white text-base py-3 px-3.5 rounded-lg mb-3`}
                  autoFocus
                  testID="add-to-playlist-input"
                  returnKeyType="done"
                  onSubmitEditing={() => void handleCreate()}
                />
                {duplicate && trimmedName.length > 0 ? (
                  <Text style={tw`text-[#ff6b6b] mt-1 mb-2`} testID="add-to-playlist-duplicate">
                    A playlist named &ldquo;{trimmedName}&rdquo; already exists.
                  </Text>
                ) : error ? (
                  <Text style={tw`text-[#ff6b6b] mt-1 mb-2`}>{error}</Text>
                ) : null}
                <View style={tw`flex-row justify-end gap-2`}>
                  <Pressable
                    style={tw`py-2.5 px-4 rounded-lg`}
                    onPress={() => {
                      setMode('list');
                      setNewName('');
                      setError(null);
                    }}
                  >
                    <Text style={tw`text-[#aaa] text-[15px] font-semibold`}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={tw.style(
                      'py-2.5 px-4 rounded-lg bg-[#1f6feb]',
                      (!canCreate || duplicate) && 'opacity-40',
                    )}
                    disabled={!canCreate || duplicate}
                    onPress={() => void handleCreate()}
                    testID="add-to-playlist-create"
                  >
                    <Text style={tw`text-white text-[15px] font-bold`}>Create</Text>
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
