import { ListMusic } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Image, View } from 'react-native';
import { getLibraryTracks } from '../lib/library-cache';
import type { Playlist } from '../lib/playlist-store';
import { resolvePlaylistTracks } from '../lib/start-playlist';
import { tw } from '../lib/tw';
import { getCachedTrackArtwork, loadTrackArtwork } from '../lib/useTrackArtwork';

/**
 * Pick up to four representative track URIs by walking the playlist's tracks
 * and keeping one per album. Falls back to the first N tracks if there aren't
 * four distinct albums.
 */
export function pickRepresentativeUris(playlist: Playlist): string[] {
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

interface PlaylistMosaicProps {
  playlist: Playlist;
  /**
   * Lucide icon size for the empty-state placeholder. Defaults to 42 (matches
   * the grid tile); the detail screen passes a larger value.
   */
  emptyIconSize?: number;
}

/**
 * Renders the mosaic artwork for a playlist (1 or 4 distinct album covers,
 * or a placeholder icon when no artwork is available). Fills its parent —
 * the parent controls dimensions and rounding.
 */
export default function PlaylistMosaic({ playlist, emptyIconSize = 42 }: PlaylistMosaicProps) {
  const uris = useMemo(() => pickRepresentativeUris(playlist), [playlist]);
  const [artUris, setArtUris] = useState<(string | null)[]>(() =>
    uris.map((u) => getCachedTrackArtwork(u)),
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all(uris.map((u) => loadTrackArtwork(u))).then((next) => {
      if (cancelled) return;
      setArtUris(next);
    });
    return () => {
      cancelled = true;
    };
  }, [uris]);

  const distinct = artUris.filter((u): u is string => !!u);

  if (distinct.length === 0) {
    return (
      <View style={tw`w-full h-full items-center justify-center bg-[#1c1c1c]`}>
        <ListMusic
          size={emptyIconSize}
          color="#555"
          strokeWidth={2.25}
          strokeLinecap="square"
        />
      </View>
    );
  }

  if (distinct.length < 4) {
    return <Image source={{ uri: distinct[0] }} style={tw`w-full h-full`} resizeMode="cover" />;
  }

  return (
    <View style={tw`w-full h-full flex-row flex-wrap`}>
      {distinct.slice(0, 4).map((uri, idx) => (
        <View key={`${uri}-${idx}`} style={tw`w-1/2 h-1/2`}>
          <Image source={{ uri }} style={tw`w-full h-full`} resizeMode="cover" />
        </View>
      ))}
    </View>
  );
}
