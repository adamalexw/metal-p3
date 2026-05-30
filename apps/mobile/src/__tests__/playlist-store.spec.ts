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

import AsyncStorage from '@react-native-async-storage/async-storage';
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
  removeTrackIdsFromAllPlaylists,
  setActivePlaylistId,
  subscribe,
} from '../lib/playlist-store';

interface MockedStorage {
  __store: Map<string, string>;
  getItem: jest.Mock;
  setItem: jest.Mock;
  clear: jest.Mock;
}

const mocked = AsyncStorage as unknown as MockedStorage;

beforeEach(async () => {
  mocked.__store.clear();
  mocked.setItem.mockClear();
  mocked.getItem.mockClear();
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
