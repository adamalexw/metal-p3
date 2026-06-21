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

export async function renamePlaylist(playlistId: string, rawName: string): Promise<void> {
  const name = rawName.trim();
  if (!name) throw new Error('Playlist name is required.');
  const idx = playlists.findIndex((p) => p.id === playlistId);
  if (idx === -1) throw new Error(`Playlist ${playlistId} not found.`);
  if (playlists[idx].name === name) return;
  const clash = playlists.some(
    (p) => p.id !== playlistId && p.name.toLowerCase() === name.toLowerCase(),
  );
  if (clash) throw new DuplicatePlaylistNameError(name);
  const updated: Playlist = { ...playlists[idx], name, updatedAt: Date.now() };
  playlists = [...playlists.slice(0, idx), updated, ...playlists.slice(idx + 1)];
  await persist();
  notify();
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string,
): Promise<void> {
  const idx = playlists.findIndex((p) => p.id === playlistId);
  if (idx === -1) return;
  const existing = playlists[idx];
  const filtered = existing.trackIds.filter((id) => id !== trackId);
  if (filtered.length === existing.trackIds.length) return;
  const updated: Playlist = { ...existing, trackIds: filtered, updatedAt: Date.now() };
  playlists = [...playlists.slice(0, idx), updated, ...playlists.slice(idx + 1)];
  await persist();
  notify();
}

export async function setPlaylistTracks(
  playlistId: string,
  trackIds: string[],
): Promise<void> {
  const idx = playlists.findIndex((p) => p.id === playlistId);
  if (idx === -1) throw new Error(`Playlist ${playlistId} not found.`);
  const existing = playlists[idx];
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const id of trackIds) {
    if (typeof id !== 'string') continue;
    if (seen.has(id)) continue;
    seen.add(id);
    deduped.push(id);
  }
  const same = deduped.length === existing.trackIds.length
    && deduped.every((id, i) => id === existing.trackIds[i]);
  if (same) return;
  const updated: Playlist = { ...existing, trackIds: deduped, updatedAt: Date.now() };
  playlists = [...playlists.slice(0, idx), updated, ...playlists.slice(idx + 1)];
  await persist();
  notify();
}

export async function reorderPlaylistTracks(
  playlistId: string,
  fromIndex: number,
  toIndex: number,
): Promise<void> {
  if (fromIndex === toIndex) return;
  const idx = playlists.findIndex((p) => p.id === playlistId);
  if (idx === -1) return;
  const existing = playlists[idx];
  if (
    fromIndex < 0
    || toIndex < 0
    || fromIndex >= existing.trackIds.length
    || toIndex >= existing.trackIds.length
  ) return;
  const next = [...existing.trackIds];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  const updated: Playlist = { ...existing, trackIds: next, updatedAt: Date.now() };
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

export interface ImportedPlaylist {
  name: string;
  trackIds: string[];
}

interface ImportManifestsResult {
  imported: ImportedPlaylist[];
  pending: number;
}

// When a manifest's MP3s have been pushed but MediaScanner hasn't indexed them
// yet, the native importer reports them as `pending` and leaves them on disk.
// Rather than wait for the next app-foreground, retry on a short backoff so a
// transfer into an already-open app lands within a few seconds.
const RECONCILE_RETRY_DELAYS_MS = [1000, 3000, 6000];

let reconcileRetryHandle: ReturnType<typeof setTimeout> | null = null;

function importManifestsOnce(): Promise<ImportManifestsResult> | null {
  let fn: (() => Promise<ImportManifestsResult>) | undefined;
  try {
    const mod: { MetalP3Player?: { importPlaylistManifests?: () => Promise<ImportManifestsResult> } } =
      require('../../modules/metalp3-player');
    fn = mod?.MetalP3Player?.importPlaylistManifests;
  } catch (err) {
    if (process.env.JEST_WORKER_ID === undefined) {
      console.warn('playlist-store: importPlaylistManifests unavailable', err);
    }
    return null;
  }
  if (!fn) return null;
  return fn();
}

async function mergeImported(imported: ImportedPlaylist[]): Promise<void> {
  if (!imported.length) return;
  if (!loaded) await loadPlaylists();

  for (const entry of imported) {
    const name = entry?.name?.trim();
    if (!name) continue;
    const trackIds = Array.isArray(entry.trackIds)
      ? entry.trackIds.filter((id): id is string => typeof id === 'string')
      : [];
    if (!trackIds.length) continue;

    const existing = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      await setPlaylistTracks(existing.id, trackIds);
    } else {
      try {
        const created = await createPlaylist(name);
        await setPlaylistTracks(created.id, trackIds);
      } catch (err) {
        if (process.env.JEST_WORKER_ID === undefined) {
          console.warn(`playlist-store: failed to create imported playlist "${name}"`, err);
        }
      }
    }
  }
}

/**
 * Pull any playlist manifests pushed from the desktop app via ADB,
 * resolved to MediaStore IDs by the native module, and merge them into
 * the JS-owned playlist store. Same-named playlists are replaced in
 * place so the desktop is the source of truth for that name.
 *
 * If the native importer reports manifests still pending (their tracks
 * aren't indexed yet), this schedules bounded retries on a short backoff
 * so a transfer is picked up promptly without waiting for the next
 * app-foreground.
 *
 * Best-effort: if the native module isn't available (Jest, iOS) it
 * resolves to no-op.
 *
 * @param attempt internal — retry index into RECONCILE_RETRY_DELAYS_MS.
 */
export async function reconcileImportedPlaylists(attempt = 0): Promise<void> {
  // A fresh reconcile (e.g. app-foreground) supersedes any scheduled retry.
  if (attempt === 0 && reconcileRetryHandle) {
    clearTimeout(reconcileRetryHandle);
    reconcileRetryHandle = null;
  }

  const pendingCall = importManifestsOnce();
  if (!pendingCall) return;

  let result: ImportManifestsResult;
  try {
    result = (await pendingCall) ?? { imported: [], pending: 0 };
  } catch (err) {
    if (process.env.JEST_WORKER_ID === undefined) {
      console.warn('playlist-store: importPlaylistManifests failed', err);
    }
    return;
  }

  await mergeImported(result.imported ?? []);

  // Schedule a retry only while tracks remain unindexed and we have backoff left.
  if (result.pending > 0 && attempt < RECONCILE_RETRY_DELAYS_MS.length) {
    if (reconcileRetryHandle) clearTimeout(reconcileRetryHandle);
    reconcileRetryHandle = setTimeout(() => {
      reconcileRetryHandle = null;
      void reconcileImportedPlaylists(attempt + 1);
    }, RECONCILE_RETRY_DELAYS_MS[attempt]);
  }
}

export function _resetForTests(): void {
  playlists = [];
  loaded = false;
  loadPromise = null;
  activePlaylistId = null;
  listeners.clear();
  if (reconcileRetryHandle) {
    clearTimeout(reconcileRetryHandle);
    reconcileRetryHandle = null;
  }
}
