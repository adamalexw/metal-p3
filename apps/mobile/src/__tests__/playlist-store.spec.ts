import AsyncStorage from '@react-native-async-storage/async-storage';
import { MetalP3Player } from '../../modules/metalp3-player';
import {
  PLAYLIST_STORAGE_KEY,
  _resetForTests,
  addTrackToPlaylist,
  createPlaylist,
  deletePlaylist,
  DuplicatePlaylistNameError,
  getActivePlaylistId,
  getPlaylist,
  getPlaylists,
  loadPlaylists,
  reconcileImportedPlaylists,
  removeTrackFromPlaylist,
  removeTrackIdsFromAllPlaylists,
  renamePlaylist,
  reorderPlaylistTracks,
  setActivePlaylistId,
  subscribe,
} from '../lib/playlist-store';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
      __store: store,
    },
  };
});

jest.mock(
  '../../modules/metalp3-player',
  () => ({
    __esModule: true,
    MetalP3Player: { importPlaylistManifests: jest.fn() },
  }),
  { virtual: true },
);

interface MockedStorage {
  __store: Map<string, string>;
  getItem: jest.Mock;
  setItem: jest.Mock;
  clear: jest.Mock;
}

const mocked = AsyncStorage as unknown as MockedStorage;
const mockImportPlaylistManifests = MetalP3Player.importPlaylistManifests as jest.Mock;

beforeEach(async () => {
  mocked.__store.clear();
  mocked.setItem.mockClear();
  mocked.getItem.mockClear();
  mockImportPlaylistManifests.mockReset();
  _resetForTests();
});

describe('playlist-store', () => {
  it('creates a playlist and persists it as JSON under the storage key', async () => {
    await loadPlaylists();
    const created = await createPlaylist('Road Trip');

    expect(created.name).toBe('Road Trip');
    expect(created.trackIds).toEqual([]);
    expect(getPlaylists()).toHaveLength(1);

    const persisted = mocked.__store.get(PLAYLIST_STORAGE_KEY);
    expect(persisted).toBeDefined();
    expect(JSON.parse(persisted ?? '')).toEqual([
      expect.objectContaining({ id: created.id, name: 'Road Trip', trackIds: [] }),
    ]);
  });

  it('rejects an empty playlist name and a duplicate playlist name (case-insensitive)', async () => {
    await loadPlaylists();
    await createPlaylist('Heavy');
    await expect(createPlaylist('   ')).rejects.toThrow(/required/);
    await expect(createPlaylist('heavy')).rejects.toBeInstanceOf(DuplicatePlaylistNameError);
  });

  it('adds a track to a playlist without duplicating it', async () => {
    await loadPlaylists();
    const pl = await createPlaylist('Sludge');
    await addTrackToPlaylist(pl.id, 'track-1');
    await addTrackToPlaylist(pl.id, 'track-2');
    await addTrackToPlaylist(pl.id, 'track-1');

    expect(getPlaylist(pl.id)?.trackIds).toEqual(['track-1', 'track-2']);
  });

  it('persists across a fresh load (round-trip)', async () => {
    await loadPlaylists();
    const pl = await createPlaylist('Mix');
    await addTrackToPlaylist(pl.id, 'track-9');

    _resetForTests();
    expect(getPlaylists()).toEqual([]);

    const reloaded = await loadPlaylists();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].name).toBe('Mix');
    expect(reloaded[0].trackIds).toEqual(['track-9']);
  });

  it('treats malformed storage JSON as empty and keeps working', async () => {
    mocked.__store.set(PLAYLIST_STORAGE_KEY, '{not valid');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const loaded = await loadPlaylists();
    expect(loaded).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('notifies subscribers after every mutation', async () => {
    await loadPlaylists();
    const listener = jest.fn();
    const unsubscribe = subscribe(listener);

    const pl = await createPlaylist('Subbed');
    await addTrackToPlaylist(pl.id, 't1');

    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    await addTrackToPlaylist(pl.id, 't2');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('deletePlaylist removes the playlist, persists, and clears activePlaylistId when it matched', async () => {
    await loadPlaylists();
    const a = await createPlaylist('Keep');
    const b = await createPlaylist('Drop');
    setActivePlaylistId(b.id);

    await deletePlaylist(b.id);

    expect(getPlaylists()).toHaveLength(1);
    expect(getPlaylist(b.id)).toBeUndefined();
    expect(getPlaylist(a.id)).toBeDefined();
    expect(getActivePlaylistId()).toBeNull();

    const persisted = JSON.parse(mocked.__store.get(PLAYLIST_STORAGE_KEY) ?? '[]');
    expect(persisted).toHaveLength(1);
    expect(persisted[0].id).toBe(a.id);
  });

  it('deletePlaylist on a non-matching active id leaves activePlaylistId untouched', async () => {
    await loadPlaylists();
    const a = await createPlaylist('Stays');
    const b = await createPlaylist('Goes');
    setActivePlaylistId(a.id);

    await deletePlaylist(b.id);

    expect(getActivePlaylistId()).toBe(a.id);
  });

  it('renamePlaylist updates the name and persists', async () => {
    await loadPlaylists();
    const pl = await createPlaylist('Old');
    await renamePlaylist(pl.id, 'New Name');
    expect(getPlaylist(pl.id)?.name).toBe('New Name');
    const persisted = JSON.parse(mocked.__store.get(PLAYLIST_STORAGE_KEY) ?? '[]');
    expect(persisted[0].name).toBe('New Name');
  });

  it('renamePlaylist trims whitespace and rejects empty names', async () => {
    await loadPlaylists();
    const pl = await createPlaylist('Keep');
    await expect(renamePlaylist(pl.id, '   ')).rejects.toThrow(/required/);
    await renamePlaylist(pl.id, '  Spaced  ');
    expect(getPlaylist(pl.id)?.name).toBe('Spaced');
  });

  it('renamePlaylist rejects a duplicate name (case-insensitive) but allows same-name no-op', async () => {
    await loadPlaylists();
    const a = await createPlaylist('Alpha');
    await createPlaylist('Beta');
    await expect(renamePlaylist(a.id, 'beta')).rejects.toBeInstanceOf(DuplicatePlaylistNameError);
    // Same name as itself is a silent no-op, even cased differently in storage.
    await expect(renamePlaylist(a.id, 'Alpha')).resolves.toBeUndefined();
  });

  it('removeTrackFromPlaylist removes the track and persists', async () => {
    await loadPlaylists();
    const pl = await createPlaylist('PL');
    await addTrackToPlaylist(pl.id, 't1');
    await addTrackToPlaylist(pl.id, 't2');
    await addTrackToPlaylist(pl.id, 't3');
    await removeTrackFromPlaylist(pl.id, 't2');
    expect(getPlaylist(pl.id)?.trackIds).toEqual(['t1', 't3']);
  });

  it('removeTrackFromPlaylist is a no-op when the track is not in the playlist', async () => {
    await loadPlaylists();
    const pl = await createPlaylist('PL');
    await addTrackToPlaylist(pl.id, 't1');
    const writesBefore = mocked.setItem.mock.calls.length;
    await removeTrackFromPlaylist(pl.id, 'nonexistent');
    expect(mocked.setItem.mock.calls.length).toBe(writesBefore);
    expect(getPlaylist(pl.id)?.trackIds).toEqual(['t1']);
  });

  it('reorderPlaylistTracks moves a track between indices', async () => {
    await loadPlaylists();
    const pl = await createPlaylist('Order');
    await addTrackToPlaylist(pl.id, 'a');
    await addTrackToPlaylist(pl.id, 'b');
    await addTrackToPlaylist(pl.id, 'c');
    await reorderPlaylistTracks(pl.id, 0, 2);
    expect(getPlaylist(pl.id)?.trackIds).toEqual(['b', 'c', 'a']);
  });

  it('reorderPlaylistTracks is a no-op for equal indices or out-of-range positions', async () => {
    await loadPlaylists();
    const pl = await createPlaylist('Order');
    await addTrackToPlaylist(pl.id, 'a');
    await addTrackToPlaylist(pl.id, 'b');
    const writesBefore = mocked.setItem.mock.calls.length;
    await reorderPlaylistTracks(pl.id, 0, 0);
    await reorderPlaylistTracks(pl.id, 5, 0);
    await reorderPlaylistTracks(pl.id, 0, -1);
    expect(mocked.setItem.mock.calls.length).toBe(writesBefore);
    expect(getPlaylist(pl.id)?.trackIds).toEqual(['a', 'b']);
  });

  it('removeTrackIdsFromAllPlaylists strips the given ids from every playlist', async () => {
    await loadPlaylists();
    const a = await createPlaylist('A');
    const b = await createPlaylist('B');
    await addTrackToPlaylist(a.id, 't1');
    await addTrackToPlaylist(a.id, 't2');
    await addTrackToPlaylist(b.id, 't2');
    await addTrackToPlaylist(b.id, 't3');

    await removeTrackIdsFromAllPlaylists(['t2']);

    expect(getPlaylist(a.id)?.trackIds).toEqual(['t1']);
    expect(getPlaylist(b.id)?.trackIds).toEqual(['t3']);
  });
});

describe('reconcileImportedPlaylists', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('merges a fully-resolved manifest into the store', async () => {
    mockImportPlaylistManifests.mockResolvedValueOnce({
      imported: [{ name: 'From Desktop', trackIds: ['10', '11'] }],
      pending: 0,
    });

    await reconcileImportedPlaylists();

    const pl = getPlaylists().find((p) => p.name === 'From Desktop');
    expect(pl?.trackIds).toEqual(['10', '11']);
    // No pending manifests → no retry scheduled.
    expect(mockImportPlaylistManifests).toHaveBeenCalledTimes(1);
  });

  it('replaces a same-named playlist in place (desktop is source of truth)', async () => {
    await loadPlaylists();
    const existing = await createPlaylist('Shared');
    await addTrackToPlaylist(existing.id, 'old');

    mockImportPlaylistManifests.mockResolvedValueOnce({
      imported: [{ name: 'shared', trackIds: ['new-1', 'new-2'] }],
      pending: 0,
    });

    await reconcileImportedPlaylists();

    expect(getPlaylists()).toHaveLength(1);
    expect(getPlaylist(existing.id)?.trackIds).toEqual(['new-1', 'new-2']);
  });

  it('retries on a backoff while manifests remain pending, then stops once resolved', async () => {
    mockImportPlaylistManifests
      .mockResolvedValueOnce({ imported: [], pending: 1 })
      .mockResolvedValueOnce({ imported: [], pending: 1 })
      .mockResolvedValueOnce({ imported: [{ name: 'Late', trackIds: ['7'] }], pending: 0 });

    await reconcileImportedPlaylists();
    expect(mockImportPlaylistManifests).toHaveBeenCalledTimes(1);

    // First retry after 1s.
    await jest.advanceTimersByTimeAsync(1000);
    expect(mockImportPlaylistManifests).toHaveBeenCalledTimes(2);

    // Second retry after 3s more.
    await jest.advanceTimersByTimeAsync(3000);
    expect(mockImportPlaylistManifests).toHaveBeenCalledTimes(3);

    // Resolved on the third pass → no further retries.
    await jest.advanceTimersByTimeAsync(6000);
    expect(mockImportPlaylistManifests).toHaveBeenCalledTimes(3);
    expect(getPlaylists().find((p) => p.name === 'Late')?.trackIds).toEqual(['7']);
  });

  it('gives up after exhausting the retry budget', async () => {
    mockImportPlaylistManifests.mockResolvedValue({ imported: [], pending: 1 });

    await reconcileImportedPlaylists();
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(3000);
    await jest.advanceTimersByTimeAsync(6000);
    // 1 initial + 3 retries, then stop.
    expect(mockImportPlaylistManifests).toHaveBeenCalledTimes(4);
    await jest.advanceTimersByTimeAsync(60000);
    expect(mockImportPlaylistManifests).toHaveBeenCalledTimes(4);
  });

  it('a fresh reconcile cancels a scheduled retry', async () => {
    mockImportPlaylistManifests
      .mockResolvedValueOnce({ imported: [], pending: 1 })
      .mockResolvedValueOnce({ imported: [{ name: 'Fresh', trackIds: ['1'] }], pending: 0 });

    await reconcileImportedPlaylists();
    expect(mockImportPlaylistManifests).toHaveBeenCalledTimes(1);

    // A new top-level reconcile (e.g. app foreground) supersedes the pending retry.
    await reconcileImportedPlaylists();
    expect(mockImportPlaylistManifests).toHaveBeenCalledTimes(2);

    // The originally-scheduled 1s retry must have been cancelled.
    await jest.advanceTimersByTimeAsync(10000);
    expect(mockImportPlaylistManifests).toHaveBeenCalledTimes(2);
  });
});
