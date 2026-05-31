import { MetalP3Player } from '../../modules/metalp3-player';
import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';
import { prefetchArtworkTheme } from '../theme/useArtworkTheme';
import { getLibraryTracks } from './library-cache';
import {
  getPlaylist,
  loadPlaylists,
  setActivePlaylistId,
  type Playlist,
} from './playlist-store';
import { toQueueItem } from './to-queue-item';

export type StartPlaylistFailure =
  | 'missing'
  | 'empty-library'
  | 'empty-playlist'
  | 'error';

export interface StartPlaylistSuccess {
  ok: true;
  playlist: Playlist;
}

export interface StartPlaylistError {
  ok: false;
  reason: StartPlaylistFailure;
  message?: string;
}

export type StartPlaylistResult = StartPlaylistSuccess | StartPlaylistError;

export function resolvePlaylistTracks(playlist: Playlist, library: Track[]): Track[] {
  const byId = new Map(library.map((t) => [t.id, t]));
  const out: Track[] = [];
  for (const id of playlist.trackIds) {
    const found = byId.get(id);
    if (found) out.push(found);
  }
  return out;
}

export async function startPlaylist(playlistId: string): Promise<StartPlaylistResult> {
  await loadPlaylists();
  const playlist = getPlaylist(playlistId);
  if (!playlist) return { ok: false, reason: 'missing' };

  const library = getLibraryTracks();
  if (library.length === 0) return { ok: false, reason: 'empty-library' };

  const tracks = resolvePlaylistTracks(playlist, library);
  if (tracks.length === 0) return { ok: false, reason: 'empty-playlist' };

  prefetchArtworkTheme(tracks[0]?.uri);
  if (tracks.length > 1) prefetchArtworkTheme(tracks[1]?.uri);

  try {
    await MetalP3Player.setQueueAsync(tracks.map(toQueueItem), 0, 0);
    await MetalP3Player.play();
    setActivePlaylistId(playlist.id);
    return { ok: true, playlist };
  } catch (err) {
    return { ok: false, reason: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}
