import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';
import { groupTracksByAlbum, type AlbumGroup } from './group-tracks-by-album';

type Listener = () => void;

let cachedTracks: Track[] = [];
let cachedGroups: AlbumGroup[] = [];
const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (err) {
      console.warn('library-cache listener threw', err);
    }
  }
}

export function setLibraryTracks(tracks: Track[]): AlbumGroup[] {
  cachedTracks = tracks;
  cachedGroups = groupTracksByAlbum(tracks);
  notify();
  return cachedGroups;
}

export function getLibraryTracks(): Track[] {
  return cachedTracks;
}

export function getAlbumGroups(): AlbumGroup[] {
  return cachedGroups;
}

export function findAlbumGroup(key: string): AlbumGroup | undefined {
  return cachedGroups.find((g) => g.key === key);
}

export function clearLibraryCache(): void {
  cachedTracks = [];
  cachedGroups = [];
  notify();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function removeTracksByIds(ids: string[]): AlbumGroup[] {
  if (ids.length === 0) return cachedGroups;
  const removeSet = new Set(ids);
  const next = cachedTracks.filter((t) => !removeSet.has(t.id));
  if (next.length === cachedTracks.length) return cachedGroups;
  cachedTracks = next;
  cachedGroups = groupTracksByAlbum(next);
  notify();
  return cachedGroups;
}
