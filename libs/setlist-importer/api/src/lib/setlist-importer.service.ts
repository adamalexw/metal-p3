import { BASE_PATH_TOKEN } from '@metal-p3/api-interfaces';
import { ImportedSetlist, ImportedTrack, MatchTracksRequest, ResolvedTrack, ScrapeSetlistsRequest } from '@metal-p3/setlist-importer/domain';
import { DbService } from '@metal-p3/shared/database';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import Fuse from 'fuse.js';
import { extname, join } from 'path';
import { firstValueFrom } from 'rxjs';
import { ALBUM_FUSE_THRESHOLD, AlbumCandidate, FILE_FUSE_THRESHOLD, normalizeForMatch, parseSetlistHtml, tokenizeFilename, trackKey } from './setlist-importer-helpers';

@Injectable()
export class SetlistImporterService {
  private readonly logger = new Logger(SetlistImporterService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly dbService: DbService,
    private readonly fileSystemService: FileSystemService,
    @Inject(BASE_PATH_TOKEN) private readonly basePath: string,
  ) {}

  async scrape(request: ScrapeSetlistsRequest): Promise<ImportedSetlist[]> {
    const out: ImportedSetlist[] = [];

    for (const url of request.urls) {
      try {
        const response = await firstValueFrom(this.httpService.get<string>(url, { headers: { 'User-Agent': 'metal-p3 (https://github.com/adamalexw/metal-p3)' }, responseType: 'text' }));
        const setlist = parseSetlistHtml(response.data, url);
        out.push(setlist);
      } catch (error) {
        this.logger.error(`Failed to scrape setlist ${url}: ${error}`);
        out.push({ id: url, url, artist: '', tracks: [], error: error instanceof Error ? error.message : String(error) });
      }
    }

    return out;
  }

  async match(request: MatchTracksRequest): Promise<ResolvedTrack[]> {
    const unique = this.dedupeTracks(request.setlists);

    const byArtist = new Map<string, ImportedTrack[]>();
    for (const track of unique) {
      const list = byArtist.get(track.artist) ?? [];
      list.push(track.track);
      byArtist.set(track.artist, list);
    }

    const candidatesByArtist = new Map<string, AlbumCandidate[]>();
    for (const artist of byArtist.keys()) {
      candidatesByArtist.set(artist, await this.candidateAlbumsForArtist(artist));
    }

    const filesByFolder = new Map<string, string[]>();

    const resolved: ResolvedTrack[] = [];

    for (const { artist, track } of unique) {
      const candidates = candidatesByArtist.get(artist) ?? [];

      const albumHit = track.hintedAlbum ? this.matchAlbum(candidates, track.hintedAlbum) : undefined;

      let match: ResolvedTrack['match'] = undefined;

      if (albumHit) {
        match = this.matchTrackInAlbum(albumHit, track.title, filesByFolder);
      }

      if (!match) {
        for (const candidate of candidates) {
          if (albumHit && candidate.id === albumHit.id) continue;
          match = this.matchTrackInAlbum(candidate, track.title, filesByFolder);
          if (match) break;
        }
      }

      resolved.push({
        key: trackKey(artist, track.title),
        artist,
        title: track.title,
        hintedAlbum: track.hintedAlbum,
        status: match ? 'matched' : 'missing',
        match,
        selected: !!match,
      });
    }

    return resolved;
  }

  private dedupeTracks(setlists: ImportedSetlist[]): { artist: string; track: ImportedTrack }[] {
    const seen = new Map<string, { artist: string; track: ImportedTrack }>();

    for (const setlist of setlists) {
      const artist = setlist.artist;
      if (!artist) continue;

      for (const track of setlist.tracks) {
        if (!track.title) continue;
        const key = trackKey(artist, track.title);

        const existing = seen.get(key);
        if (!existing) {
          seen.set(key, { artist, track });
          continue;
        }

        if (!existing.track.hintedAlbum && track.hintedAlbum) {
          seen.set(key, { artist, track: { ...existing.track, hintedAlbum: track.hintedAlbum, songPageUrl: existing.track.songPageUrl ?? track.songPageUrl } });
        }
      }
    }

    return Array.from(seen.values());
  }

  private async candidateAlbumsForArtist(artist: string): Promise<AlbumCandidate[]> {
    try {
      const albums = await this.dbService.albums({
        where: { Band: { Name: { contains: artist } } },
        orderBy: { Year: 'asc' },
      });

      return albums.map((a) => ({ id: a.AlbumId, name: a.Name ?? '', folder: a.Folder }));
    } catch (error) {
      this.logger.error(`Failed to load candidate albums for "${artist}": ${error}`);
      return [];
    }
  }

  private matchAlbum(candidates: AlbumCandidate[], hintedAlbum: string): AlbumCandidate | undefined {
    if (!candidates.length) return undefined;

    const fuse = new Fuse(candidates, {
      keys: ['name'],
      threshold: ALBUM_FUSE_THRESHOLD,
      ignoreLocation: true,
      includeScore: true,
    });

    const [hit] = fuse.search(normalizeForMatch(hintedAlbum));
    return hit?.item;
  }

  private matchTrackInAlbum(candidate: AlbumCandidate, title: string, cache: Map<string, string[]>): ResolvedTrack['match'] | undefined {
    const folderPath = join(this.basePath, candidate.folder);

    let files = cache.get(folderPath);
    if (!files) {
      try {
        files = this.fileSystemService.getFiles(folderPath).filter((f) => extname(f).toLowerCase() === '.mp3');
      } catch {
        files = [];
      }
      cache.set(folderPath, files);
    }

    if (!files.length) return undefined;

    const indexed = files.map((file) => ({ file, normalized: tokenizeFilename(file) }));

    const fuse = new Fuse(indexed, {
      keys: ['normalized'],
      threshold: FILE_FUSE_THRESHOLD,
      ignoreLocation: true,
      includeScore: true,
    });

    const [hit] = fuse.search(normalizeForMatch(title));
    if (!hit) return undefined;

    return {
      albumId: candidate.id,
      albumName: candidate.name,
      folder: candidate.folder,
      fullPath: join(folderPath, hit.item.file),
      score: hit.score ?? 0,
    };
  }
}

