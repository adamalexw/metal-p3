import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';
import type { QueueItem } from '../../modules/metalp3-player/src/MetalP3Player.types';

export function toQueueItem(t: Track): QueueItem {
  return {
    id: t.id,
    uri: t.uri,
    title: t.title,
    artist: t.artist,
    album: t.album,
    albumArtist: t.albumArtist,
    durationMs: t.durationMs,
  };
}
