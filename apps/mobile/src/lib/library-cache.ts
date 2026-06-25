import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo, useSyncExternalStore } from 'react';
import { MetalP3Media } from '../../modules/metalp3-media';
import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';
import { groupTracksByAlbum, type AlbumGroup } from './group-tracks-by-album';
import { getPlaylists, subscribe as subscribePlaylists } from './playlist-store';

type Listener = () => void;

let cachedTracks: Track[] = [];
let cachedGroups: AlbumGroup[] = [];
let filteredCachedGroups: AlbumGroup[] = [];
const listeners = new Set<Listener>();

function rebuildFilteredGroups(): void {
  const playlists = getPlaylists();
  const hiddenIds = new Set<string>();
  for (const p of playlists) {
    for (const t of p.trackIds) hiddenIds.add(t);
  }
  if (hiddenIds.size === 0) {
    filteredCachedGroups = cachedGroups;
  } else {
    const visible = cachedTracks.filter((t) => !hiddenIds.has(t.id));
    filteredCachedGroups = groupTracksByAlbum(visible);
  }
}

subscribePlaylists(() => {
  rebuildFilteredGroups();
  notify();
});

function notify(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (err) {
      console.warn('library-cache listener threw', err);
    }
  }
}

export async function initializeLibraryCache(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem('metalp3:library_tracks:v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedTracks = parsed;
        cachedGroups = groupTracksByAlbum(parsed);
        rebuildFilteredGroups();
        notify();
      }
    }
  } catch (err) {
    console.warn('library-cache: failed to initialize cache', err);
  }
}

async function verifyAndClearLibraryCache(): Promise<void> {
  const currentTracks = [...cachedTracks];
  if (currentTracks.length === 0) return;

  const checkCount = Math.min(3, currentTracks.length);
  let anyExists = false;
  for (let i = 0; i < checkCount; i++) {
    try {
      const exists = await MetalP3Media.checkTrackExistsAsync(currentTracks[i].uri);
      if (exists) {
        anyExists = true;
        break;
      }
    } catch (err) {
      console.warn('library-cache: verification check failed', err);
    }
  }

  if (!anyExists) {
    console.warn('library-cache: none of the verified cached tracks exist. Clearing library cache.');
    clearLibraryCache();
  } else {
    console.log('library-cache: cached tracks still exist on device. Keeping library intact.');
  }
}

export function setLibraryTracks(tracks: Track[]): AlbumGroup[] {
  if (tracks.length === 0 && cachedTracks.length > 0) {
    void verifyAndClearLibraryCache();
    return filteredCachedGroups;
  }

  cachedTracks = tracks;
  cachedGroups = groupTracksByAlbum(tracks);
  rebuildFilteredGroups();
  void AsyncStorage.setItem('metalp3:library_tracks:v1', JSON.stringify(tracks)).catch((err) => {
    console.warn('library-cache: failed to persist tracks', err);
  });
  notify();
  return filteredCachedGroups;
}

export function getLibraryTracks(): Track[] {
  return cachedTracks;
}

export function getAlbumGroups(): AlbumGroup[] {
  return filteredCachedGroups;
}

export function findAlbumGroup(key: string): AlbumGroup | undefined {
  return filteredCachedGroups.find((g) => g.key === key);
}

export function clearLibraryCache(): void {
  cachedTracks = [];
  cachedGroups = [];
  filteredCachedGroups = [];
  void AsyncStorage.removeItem('metalp3:library_tracks:v1').catch((err) => {
    console.warn('library-cache: failed to remove persisted tracks', err);
  });
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
  rebuildFilteredGroups();
  notify();
  return filteredCachedGroups;
}

/**
 * Subscribe to the album-groups snapshot. Component re-renders when the
 * cache repopulates or a delete propagates. The snapshot reference is stable
 * between cache writes, satisfying useSyncExternalStore's tearing guarantees.
 */
export function useLibraryAlbumGroups(): AlbumGroup[] {
  return useSyncExternalStore(subscribe, getAlbumGroups, getAlbumGroups);
}

export function useLibraryTracks(): Track[] {
  return useSyncExternalStore(subscribe, getLibraryTracks, getLibraryTracks);
}

export function useLibraryAlbumGroup(key: string | null | undefined): AlbumGroup | undefined {
  const groups = useLibraryAlbumGroups();
  return useMemo(() => (key ? groups.find((g) => g.key === key) : undefined), [groups, key]);
}
