import { MetalP3Media } from '../../modules/metalp3-media';
import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';
import { MetalP3Player } from '../../modules/metalp3-player';
import { removeTracksByIds, getLibraryTracks } from './library-cache';
import { removeTrackIdsFromAllPlaylists } from './playlist-store';
import { toQueueItem } from './to-queue-item';

export interface DeleteTracksOutcome {
  deletedIds: string[];
  failedUris: string[];
}

/**
 * Deletes the given tracks via the native bridge, then propagates the change
 * through every downstream surface that holds copies of those track ids:
 * library cache, playlists, and the active player queue (advancing or
 * stopping playback if the current track was deleted).
 *
 * When `mode` is "album-folder", the native side bundles every file in the
 * tracks' parent folder (audio + artwork + sidecars) into a single delete
 * request so the folder is left empty.
 */
export async function deleteTracksAndPropagate(
  tracks: Track[],
  mode: 'tracks' | 'album-folder' = 'tracks',
): Promise<DeleteTracksOutcome> {
  if (tracks.length === 0) return { deletedIds: [], failedUris: [] };

  const uris = tracks.map((t) => t.uri);
  const result = mode === 'album-folder'
    ? await MetalP3Media.deleteAlbumFolderAsync(uris)
    : await MetalP3Media.deleteTracksAsync(uris);
  const deletedUriSet = new Set(result.deletedUris);
  const deletedIds = tracks.filter((t) => deletedUriSet.has(t.uri)).map((t) => t.id);
  if (deletedIds.length === 0) {
    return { deletedIds: [], failedUris: result.failedUris };
  }

  removeTracksByIds(deletedIds);
  await removeTrackIdsFromAllPlaylists(deletedIds);
  await reconcileQueue(deletedIds);
  return { deletedIds, failedUris: result.failedUris };
}

async function reconcileQueue(deletedIds: string[]): Promise<void> {
  if (deletedIds.length === 0) return;
  const removeSet = new Set(deletedIds);
  let state;
  try {
    state = await MetalP3Player.getStateAsync();
  } catch (err) {
    console.warn('delete-tracks: failed to read player state', err);
    return;
  }

  const queue = state.queue ?? [];
  const queueHasDeletion = queue.some((item) => removeSet.has(item.id));
  if (!queueHasDeletion) return;

  const survivingTracks = getLibraryTracks().filter((t) =>
    queue.some((q) => q.id === t.id) && !removeSet.has(t.id),
  );
  const survivingQueue = queue.filter((item) => !removeSet.has(item.id));

  if (survivingQueue.length === 0) {
    try {
      await MetalP3Player.stop();
    } catch (err) {
      console.warn('delete-tracks: failed to stop playback', err);
    }
    return;
  }

  const currentId = state.current?.id ?? null;
  const currentDeleted = currentId !== null && removeSet.has(currentId);
  let newIndex = currentDeleted
    ? Math.min(state.currentIndex, survivingQueue.length - 1)
    : Math.max(0, survivingQueue.findIndex((q) => q.id === currentId));
  if (newIndex < 0) newIndex = 0;

  const nextItems = survivingQueue.map((q) => {
    const fresh = survivingTracks.find((t) => t.id === q.id);
    return fresh ? toQueueItem(fresh) : q;
  });

  try {
    const positionMs = currentDeleted ? 0 : state.positionMs;
    await MetalP3Player.setQueueAsync(nextItems, newIndex, positionMs);
    if (currentDeleted && state.isPlaying) {
      await MetalP3Player.play();
    }
  } catch (err) {
    console.warn('delete-tracks: failed to rebuild queue', err);
  }
}
