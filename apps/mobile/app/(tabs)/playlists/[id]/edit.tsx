import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Pencil, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLibraryTracks } from '../../../../src/lib/library-cache';
import {
  Playlist,
  DuplicatePlaylistNameError,
  getPlaylist,
  loadPlaylists,
  removeTrackFromPlaylist,
  renamePlaylist,
  reorderPlaylistTracks,
  subscribe,
} from '../../../../src/lib/playlist-store';
import { tw } from '../../../../src/lib/tw';
import type { Track } from '../../../../modules/metalp3-media/src/MetalP3Media.types';

const ICON_STROKE = 2.5;

interface RowTrack {
  id: string;
  title: string;
  subtitle: string;
}

function buildRowTracks(playlist: Playlist, library: Track[]): RowTrack[] {
  const byId = new Map(library.map((t) => [t.id, t]));
  return playlist.trackIds.map((id) => {
    const track = byId.get(id);
    if (!track) {
      return { id, title: 'Unknown track (not in library)', subtitle: '' };
    }
    const subtitleParts = [track.artist ?? track.albumArtist, track.album].filter(Boolean);
    return {
      id,
      title: track.title ?? 'Unknown title',
      subtitle: subtitleParts.join(' — '),
    };
  });
}

export default function EditPlaylistScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rawId = typeof params.id === 'string' ? params.id : '';
  const playlistId = decodeURIComponent(rawId);
  const [playlist, setPlaylist] = useState<Playlist | null>(() => getPlaylist(playlistId) ?? null);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(playlist?.name ?? '');
  const [renameError, setRenameError] = useState<string | null>(null);
  const swipeRefs = useRef(new Map<string, Swipeable>());

  useEffect(() => {
    let cancelled = false;
    void loadPlaylists().then(() => {
      if (cancelled) return;
      const found = getPlaylist(playlistId) ?? null;
      setPlaylist(found);
      setDraftName(found?.name ?? '');
    });
    const unsub = subscribe(() => {
      const found = getPlaylist(playlistId) ?? null;
      setPlaylist(found);
      if (!renaming) setDraftName(found?.name ?? '');
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [playlistId, renaming]);

  const rows = useMemo(
    () => (playlist ? buildRowTracks(playlist, getLibraryTracks()) : []),
    [playlist],
  );

  const commitRename = async () => {
    if (!playlist) return;
    const next = draftName.trim();
    if (!next || next === playlist.name) {
      setRenaming(false);
      setRenameError(null);
      setDraftName(playlist.name);
      return;
    }
    try {
      await renamePlaylist(playlist.id, next);
      setRenaming(false);
      setRenameError(null);
    } catch (err) {
      if (err instanceof DuplicatePlaylistNameError) {
        setRenameError(`A playlist named "${next}" already exists.`);
      } else {
        setRenameError(err instanceof Error ? err.message : String(err));
      }
    }
  };

  const cancelRename = () => {
    setRenaming(false);
    setRenameError(null);
    setDraftName(playlist?.name ?? '');
  };

  const onRemove = (trackId: string) => {
    if (!playlist) return;
    swipeRefs.current.get(trackId)?.close();
    void removeTrackFromPlaylist(playlist.id, trackId);
  };

  const onDragEnd = ({ from, to }: { from: number; to: number }) => {
    if (!playlist || from === to) return;
    void reorderPlaylistTracks(playlist.id, from, to);
  };

  if (!playlist) {
    return (
      <View style={tw`flex-1 bg-black`}>
        <Stack.Screen
          options={{ title: 'Edit playlist', headerShown: true, headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }}
        />
        <Text style={tw`text-[#aaa] text-center mt-12 px-6`} testID="playlist-edit-missing">
          Playlist not found.
        </Text>
      </View>
    );
  }

  const renderItem = ({ item, drag, isActive }: RenderItemParams<RowTrack>) => (
    <ScaleDecorator>
      <Swipeable
        ref={(ref) => {
          if (ref) swipeRefs.current.set(item.id, ref);
          else swipeRefs.current.delete(item.id);
        }}
        friction={2}
        rightThreshold={48}
        overshootRight={false}
        enabled={!isActive}
        renderRightActions={() => (
          <Pressable
            onPress={() => onRemove(item.id)}
            style={tw`bg-[#ff3b30] justify-center items-center px-6 min-w-[88px]`}
            testID={`playlist-edit-remove-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel="Remove from playlist"
          >
            <Trash2 size={22} color="#fff" strokeWidth={ICON_STROKE} strokeLinecap="square" />
          </Pressable>
        )}
      >
        <Pressable
          onLongPress={drag}
          delayLongPress={200}
          disabled={isActive}
          style={[
            tw`flex-row items-center py-3 px-4 bg-black`,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: 'rgba(255,255,255,0.08)',
            },
          ]}
          testID={`playlist-edit-row-${item.id}`}
        >
          <View style={tw`flex-1 pr-3`}>
            <Text style={tw`text-white text-[15px] font-semibold`} numberOfLines={1}>
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text style={tw`text-[#bbb] text-xs mt-0.5`} numberOfLines={1}>
                {item.subtitle}
              </Text>
            ) : null}
          </View>
          <Text style={tw`text-[#666] text-xs`}>Hold to reorder</Text>
        </Pressable>
      </Swipeable>
    </ScaleDecorator>
  );

  return (
    <View style={tw`flex-1 bg-black`}>
      <Stack.Screen
        options={{
          title: 'Edit playlist',
          headerShown: true,
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerBackTitle: 'Back',
        }}
      />
      <GestureHandlerRootView style={tw`flex-1`}>
        <View style={[tw`px-4 pt-4 pb-3`, { paddingTop: insets.top > 0 ? 8 : 16 }]}>
          {renaming ? (
            <View style={tw`flex-row items-center gap-2`}>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                autoFocus
                placeholder="Playlist name"
                placeholderTextColor="#666"
                style={[
                  tw`flex-1 text-white text-lg font-bold px-3 py-2 rounded-md`,
                  { backgroundColor: '#1a1a1a' },
                ]}
                onSubmitEditing={() => void commitRename()}
                returnKeyType="done"
                testID="playlist-edit-name-input"
              />
              <Pressable
                onPress={() => void commitRename()}
                style={tw`w-10 h-10 items-center justify-center rounded-full bg-[#1a1a1a]`}
                testID="playlist-edit-name-save"
                accessibilityRole="button"
                accessibilityLabel="Save name"
              >
                <Check size={20} color="#fff" strokeWidth={ICON_STROKE} strokeLinecap="square" />
              </Pressable>
              <Pressable
                onPress={cancelRename}
                style={tw`px-3 h-10 items-center justify-center`}
                testID="playlist-edit-name-cancel"
                accessibilityRole="button"
                accessibilityLabel="Cancel rename"
              >
                <Text style={tw`text-[#bbb] text-sm font-bold`}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setRenaming(true)}
              style={tw`flex-row items-center gap-2`}
              testID="playlist-edit-name"
              accessibilityRole="button"
              accessibilityLabel="Rename playlist"
            >
              <Text style={tw`text-white text-2xl font-bold flex-1`} numberOfLines={1}>
                {playlist.name}
              </Text>
              <Pencil size={18} color="#bbb" strokeWidth={ICON_STROKE} strokeLinecap="square" />
            </Pressable>
          )}
          {renameError ? (
            <Text style={tw`text-[#ff6b6b] text-xs mt-2`} testID="playlist-edit-name-error">
              {renameError}
            </Text>
          ) : null}
          <Text style={tw`text-[#888] text-[13px] mt-2`}>
            {rows.length} {rows.length === 1 ? 'track' : 'tracks'} · swipe left to remove · hold to reorder
          </Text>
        </View>
        {rows.length === 0 ? (
          <Text
            style={tw`text-[#aaa] text-center mt-12 px-6`}
            testID="playlist-edit-empty"
          >
            This playlist is empty. Long-press a track in the library to add one.
          </Text>
        ) : (
          <DraggableFlatList
            data={rows}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            onDragEnd={onDragEnd}
            activationDistance={8}
            containerStyle={tw`flex-1`}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            testID="playlist-edit-list"
          />
        )}
      </GestureHandlerRootView>
    </View>
  );
}
