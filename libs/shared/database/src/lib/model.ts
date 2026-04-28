import { Prisma } from '@metal-p3/prisma/client';

export type AlbumWithBand = Prisma.AlbumGetPayload<{ include: { Band: true } }>;
export type MissingUrlResult = {
  AlbumId: number;
  Name: string;
  Band: { BandId: number; Name: string; MetalArchiveUrl: string | null };
};
