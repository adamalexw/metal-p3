import { ListMusic } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { MetalP3Media } from '../../modules/metalp3-media';
import { getLibraryTracks } from '../lib/library-cache';
import type { Playlist } from '../lib/playlist-store';
import { resolvePlaylistTracks } from '../lib/start-playlist';
import { tw } from '../lib/tw';

const PRESS_SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

const ART_CACHE = new Map<string, string | null>();

async function fetchArtwork(uri: string): Promise<string | null> {
  if (ART_CACHE.has(uri)) return ART_CACHE.get(uri) ?? null;
  try {
    const art = await MetalP3Media.getArtworkAsync(uri);
    const value = art ? `data:${art.mimeType};base64,${art.base64}` : null;
    ART_CACHE.set(uri, value);
    return value;
  } catch {
    ART_CACHE.set(uri, null);
    return null;
  }
}

interface PlaylistTileProps {
  playlist: Playlist;
  onPress: () => void;
  onLongPress?: () => void;
}

/**
 * Pick up to four representative track URIs by walking the playlist's tracks
 * and keeping one per album. Falls back to the first N tracks if there aren't
 * four distinct albums.
 */
function pickRepresentativeUris(playlist: Playlist): string[] {
  const library = getLibraryTracks();
  if (library.length === 0) return [];
  const tracks = resolvePlaylistTracks(playlist, library);
  if (tracks.length === 0) return [];
  const seenAlbums = new Set<string>();
  const uris: string[] = [];
  for (const t of tracks) {
    const albumKey = `${(t.albumArtist ?? t.artist ?? '').toLowerCase()}|${(t.album ?? '').toLowerCase()}`;
    if (!seenAlbums.has(albumKey)) {
      seenAlbums.add(albumKey);
      uris.push(t.uri);
      if (uris.length === 4) break;
    }
  }
  if (uris.length < 4) {
    for (const t of tracks) {
      if (!uris.includes(t.uri)) uris.push(t.uri);
      if (uris.length === 4) break;
    }
  }
  return uris;
}

export default function PlaylistTile({ playlist, onPress, onLongPress }: PlaylistTileProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const uris = useMemo(
    () => pickRepresentativeUris(playlist),
    [playlist],
  );
  const [artUris, setArtUris] = useState<(string | null)[]>(() =>
    uris.map((u) => ART_CACHE.get(u) ?? null),
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all(uris.map((u) => fetchArtwork(u))).then((next) => {
      if (cancelled) return;
      setArtUris(next);
    });
    return () => {
      cancelled = true;
    };
  }, [uris]);

  const trackCount = playlist.trackIds.length;
  const meta = `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`;
  const distinctArtUris = artUris.filter((u): u is string => !!u);

  return (
    <Animated.View style={[tw`flex-1 mx-1 mb-4`, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => {
          scale.value = withSpring(0.94, PRESS_SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, PRESS_SPRING);
        }}
        testID={`playlist-tile-${playlist.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${playlist.name}, ${meta}`}
      >
        <View
          style={[
            tw`w-full aspect-square rounded-md overflow-hidden bg-[#222]`,
            {
              shadowColor: '#000',
              shadowOpacity: 0.5,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            },
          ]}
        >
          <PlaylistArt artUris={distinctArtUris} />
        </View>
        <Text style={tw`text-white text-sm font-semibold mt-2`} numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text style={tw`text-[#bbb] text-xs mt-0.5`} numberOfLines={1}>
          {meta}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function PlaylistArt({ artUris }: { artUris: string[] }) {
  if (artUris.length === 0) {
    return (
      <View style={tw`w-full h-full items-center justify-center bg-[#1c1c1c]`}>
        <ListMusic size={42} color="#555" strokeWidth={2.25} strokeLinecap="square" />
      </View>
    );
  }
  if (artUris.length < 4) {
    return <Image source={{ uri: artUris[0] }} style={tw`w-full h-full`} resizeMode="cover" />;
  }
  return (
    <View style={tw`w-full h-full flex-row flex-wrap`}>
      {artUris.slice(0, 4).map((uri, idx) => (
        <View key={`${uri}-${idx}`} style={tw`w-1/2 h-1/2`}>
          <Image source={{ uri }} style={tw`w-full h-full`} resizeMode="cover" />
        </View>
      ))}
    </View>
  );
}
