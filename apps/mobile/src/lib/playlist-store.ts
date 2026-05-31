import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

export const PLAYLIST_STORAGE_KEY = 'metalp3:playlists:v1';

type Listener = () => void;

let playlists: Playlist[] = [];
let loaded = false;
let loadPromise: Promise<Playlist[]> | null = null;
let activePlaylistId: string | null = null;
const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (err) {
      console.warn('playlist-store listener threw', err);
    }
  }
}

/**
 * Mirror the playlist set to the native side so the Android Auto browse
 * tree can read it synchronously. Best-effort — failures here are not
 * fatal to the JS app, and the native module isn't available under Jest.
 */
function syncToNative(): void {
  try {
    // Lazy require so unit tests don't need to mock the native module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod: { MetalP3Player?: { setPlaylists?: (json: string) => Promise<void> } } =
      require('../../modules/metalp3-player');
    void mod?.MetalP3Player?.setPlaylists?.(JSON.stringify(playlists));
  } catch (err) {
    if (process.env.JEST_WORKER_ID === undefined) {
      console.warn('playlist-store: native sync failed', err);
    }
  }
}

async function persist(): Promise<void> {
  await AsyncStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(playlists));
  syncToNative();
}

function isPlaylistArray(value: unknown): value is Playlist[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      item != null
      && typeof item === 'object'
      && typeof (item as Playlist).id === 'string'
      && typeof (item as Playlist).name === 'string'
      && Array.isArray((item as Playlist).trackIds)
      && (item as Playlist).trackIds.every((t) => typeof t === 'string'),
  );
}

export async function loadPlaylists(): Promise<Playlist[]> {
  if (loaded) return playlists;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(PLAYLIST_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isPlaylistArray(parsed)) {
          playlists = parsed;
        } else {
          console.warn('playlist-store: malformed playlist data, resetting');
          playlists = [];
        }
      }
    } catch (err) {
      console.warn('playlist-store: failed to load playlists', err);
      playlists = [];
    } finally {
      loaded = true;
      loadPromise = null;
      syncToNative();
      notify();
    }
    return playlists;
  })();
  return loadPromise;
}

export function getPlaylists(): Playlist[] {
  return playlists;
}

export function getPlaylist(id: string): Playlist | undefined {
  return playlists.find((p) => p.id === id);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function generateId(): string {
  return `pl_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export class DuplicatePlaylistNameError extends Error {
  constructor(name: string) {
    super(`A playlist named "${name}" already exists.`);
    this.name = 'DuplicatePlaylistNameError';
  }
}

export async function createPlaylist(rawName: string): Promise<Playlist> {
  const name = rawName.trim();
  if (!name) throw new Error('Playlist name is required.');
  const exists = playlists.some((p) => p.name.toLowerCase() === name.toLowerCase());
  if (exists) throw new DuplicatePlaylistNameError(name);
  const now = Date.now();
  const playlist: Playlist = {
    id: generateId(),
    name,
    trackIds: [],
    createdAt: now,
    updatedAt: now,
  };
  playlists = [...playlists, playlist];
  await persist();
  notify();
  return playlist;
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  const idx = playlists.findIndex((p) => p.id === playlistId);
  if (idx === -1) throw new Error(`Playlist ${playlistId} not found.`);
  const existing = playlists[idx];
  if (existing.trackIds.includes(trackId)) return;
  const updated: Playlist = {
    ...existing,
    trackIds: [...existing.trackIds, trackId],
    updatedAt: Date.now(),
  };
  playlists = [...playlists.slice(0, idx), updated, ...playlists.slice(idx + 1)];
  await persist();
  notify();
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const idx = playlists.findIndex((p) => p.id === playlistId);
  if (idx === -1) return;
  playlists = [...playlists.slice(0, idx), ...playlists.slice(idx + 1)];
  if (activePlaylistId === playlistId) {
    activePlaylistId = null;
  }
  await persist();
  notify();
}

export async function removeTrackIdsFromAllPlaylists(trackIds: string[]): Promise<void> {
  if (trackIds.length === 0) return;
  const removeSet = new Set(trackIds);
  let mutated = false;
  const now = Date.now();
  const next = playlists.map((p) => {
    const filtered = p.trackIds.filter((id) => !removeSet.has(id));
    if (filtered.length === p.trackIds.length) return p;
    mutated = true;
    return { ...p, trackIds: filtered, updatedAt: now };
  });
  if (!mutated) return;
  playlists = next;
  await persist();
  notify();
}

export function setActivePlaylistId(id: string | null): void {
  activePlaylistId = id;
}

export function getActivePlaylistId(): string | null {
  return activePlaylistId;
}

export function _resetForTests(): void {
  playlists = [];
  loaded = false;
  loadPromise = null;
  activePlaylistId = null;
  listeners.clear();
}
