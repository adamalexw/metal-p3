import { Prisma } from '@metal-p3/prisma/client';

export type BandWithAlbumCount = Prisma.BandGetPayload<{ include: { _count: { select: { Album: true } } } }>;

export type AlbumWithBand = Prisma.AlbumGetPayload<{ include: { Band: true } }>;
export type AlbumWithLyricsHistory = Prisma.AlbumGetPayload<{ include: { LyricsHistory: true } }>;
export type LyricsHistoryWithAlbum = Prisma.LyricsHistoryGetPayload<{ include: { Album: true } }>;
export type PlaylistWithItems = Prisma.PlaylistGetPayload<{ include: { PlaylistItem: true } }>;
export type MissingUrlResult = {
  AlbumId: number;
  Name: string;
  Band: { BandId: number; Name: string; MetalArchiveUrl: string | null };
};
