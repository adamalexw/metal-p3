import { ImportedSetlist, ImportedTrack } from '@metal-p3/setlist-importer/domain';
import { HTMLElement, parse } from 'node-html-parser';
import { extname } from 'path';

export const SETLIST_FM_BASE = 'https://www.setlist.fm';

export const ALBUM_FUSE_THRESHOLD = 0.4;
export const FILE_FUSE_THRESHOLD = 0.35;

const TRACK_NUMBER_PREFIX = /^\s*\d{1,3}[\s._-]+/;

export const normalizeForMatch = (input: string | undefined | null): string =>
  (input ?? '')
    .toLowerCase()
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[^\p{L}\p{N}\s'"-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const stripTrackNumber = (filename: string): string => {
  const base = filename.replace(extname(filename), '');
  return base.replace(TRACK_NUMBER_PREFIX, '').trim();
};

export const trackKey = (artist: string, title: string): string => `${normalizeForMatch(artist)}|${normalizeForMatch(title)}`;

const absoluteSetlistUrl = (href: string | undefined, pageUrl: string): string | undefined => {
  if (!href) return undefined;
  try {
    return new URL(href, pageUrl.startsWith('http') ? pageUrl : SETLIST_FM_BASE).toString();
  } catch {
    return undefined;
  }
};

const SETLIST_ID_FROM_URL = /-([0-9a-f]+)\.html/i;

const extractSetlistId = (url: string): string => {
  const match = url.match(SETLIST_ID_FROM_URL);
  return match?.[1] ?? url;
};

/**
 * Setlist.fm setlist page selectors (server-rendered HTML, captured 2026-06).
 * If selectors rot, fix them here — the test fixtures in
 * setlist-importer-helpers.spec.ts will catch regressions.
 *
 *   <div class="setlistHeadline"><h1><a href="/setlist/.../...html">Iron Maiden Setlist</a></h1></div>
 *   <a class="summary" href="/venue/..."><span>Utilita Arena, Birmingham, England</span></a>
 *   <span class="dateMonth">Jun</span><span class="dateDay">23</span><span class="dateYear">2023</span>
 *   <ol class="songsList">
 *     <li class="setlistParts song">
 *       <div class="songPart"><a href="/song/.../song-name-...html">Song Name</a></div>
 *       <div class="infoPart"><span>(from <a href="/album/...">Album Name</a>)</span></div>
 *     </li>
 *   </ol>
 */
export const parseSetlistHtml = (html: string, sourceUrl: string): ImportedSetlist => {
  const root = parse(html);

  const artist =
    root
      .querySelector('.setlistHeadline a')
      ?.textContent.replace(/setlist/i, '')
      .trim() ??
    root
      .querySelector('.setlistHeadline h1')
      ?.textContent.replace(/setlist/i, '')
      .trim() ??
    root.querySelector('a[href*="/setlists/"]')?.textContent.trim() ??
    '';

  const venue = root.querySelector('.setlistHeadline + p, .infoContainer .summary')?.textContent.trim() ?? root.querySelector('a.summary span')?.textContent.trim() ?? undefined;

  const month = root.querySelector('.dateBlock .month, .dateMonth')?.textContent.trim();
  const day = root.querySelector('.dateBlock .day, .dateDay')?.textContent.trim();
  const year = root.querySelector('.dateBlock .year, .dateYear')?.textContent.trim();
  const date = month && day && year ? `${month} ${day} ${year}` : undefined;

  const songNodes = root.querySelectorAll('ol.songsList > li.setlistParts.song, ol.songsList li[class*="song"]');

  const tracks: ImportedTrack[] = [];

  for (const node of songNodes) {
    const songAnchor = node.querySelector('.songPart a, a[href*="/song/"]');
    const title = songAnchor?.textContent.trim() ?? node.querySelector('.songPart')?.textContent.trim() ?? '';

    if (!title) continue;

    const songPageUrl = absoluteSetlistUrl(songAnchor?.getAttribute('href'), sourceUrl);

    const albumAnchor = node.querySelector('.infoPart a[href*="/album/"], .infoPart a[href*="/release/"]');
    const hintedAlbum = albumAnchor?.textContent.trim() || undefined;

    tracks.push({ title, hintedAlbum, songPageUrl });
  }

  return {
    id: extractSetlistId(sourceUrl),
    url: sourceUrl,
    artist,
    venue,
    date,
    tracks,
  };
};

export interface AlbumCandidate {
  id: number;
  name: string;
  folder: string;
}

export const tokenizeFilename = (filename: string): string => normalizeForMatch(stripTrackNumber(filename));

/**
 * Song statistics page (captured 2026-09):
 *
 *   <li class="labeledList">
 *     <span>From the release</span>
 *     <span><span>Blood in the Water</span> (<span>Album</span>)</span>
 *   </li>
 */
export const parseSongReleaseHtml = (html: string): string | undefined => {
  const root = parse(html);

  for (const item of root.querySelectorAll('li.labeledList')) {
    const [label, value] = item.childNodes.filter((child): child is HTMLElement => child instanceof HTMLElement && child.tagName === 'SPAN');
    if (!label || !value || !/from the release/i.test(label.textContent)) continue;

    const name = (value.querySelector('span')?.textContent ?? value.textContent).trim();
    return name || undefined;
  }

  return undefined;
};
