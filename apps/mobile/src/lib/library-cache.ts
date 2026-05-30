import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';
import { groupTracksByAlbum, type AlbumGroup } from './group-tracks-by-album';

let cachedTracks: Track[] = [];
let cachedGroups: AlbumGroup[] = [];

export function setLibraryTracks(tracks: Track[]): AlbumGroup[] {
  cachedTracks = tracks;
  cachedGroups = groupTracksByAlbum(tracks);
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
}
