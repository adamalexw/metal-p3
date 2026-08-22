import { MetalP3Player } from '../../modules/metalp3-player';
import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';
import { startQueue, startShuffled } from '../lib/start-queue';

jest.mock(
  '../../modules/metalp3-player',
  () => ({
    __esModule: true,
    MetalP3Player: {
      setShuffle: jest.fn(),
      setQueueAsync: jest.fn(),
      play: jest.fn(),
    },
  }),
  { virtual: true },
);

jest.mock('../theme/useArtworkTheme', () => ({
  __esModule: true,
  prefetchArtworkTheme: jest.fn(),
}));

const player = MetalP3Player as jest.Mocked<typeof MetalP3Player>;

function track(id: string): Track {
  return { id, uri: `content://${id}`, title: id, durationMs: 1000 } as Track;
}

describe('start-queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    player.setShuffle.mockResolvedValue(undefined);
    player.setQueueAsync.mockResolvedValue(undefined);
    player.play.mockResolvedValue(undefined);
  });

  describe('startQueue', () => {
    it('should disable shuffle, queue from the given index, and play', async () => {
      const result = await startQueue([track('a'), track('b')], 1);

      expect(result).toEqual({ ok: true });
      expect(player.setShuffle).toHaveBeenCalledWith(false);
      expect(player.setQueueAsync).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 'a' })]),
        1,
        0,
      );
      expect(player.play).toHaveBeenCalled();
    });

    it('should report the failure message instead of throwing', async () => {
      player.play.mockRejectedValue(new Error('no session'));

      const result = await startQueue([track('a')]);

      expect(result).toEqual({ ok: false, message: 'no session' });
    });
  });

  describe('startShuffled', () => {
    it('should queue a shuffled order before enabling shuffle', async () => {
      const result = await startShuffled([track('a'), track('b')]);

      expect(result).toEqual({ ok: true });
      const queueCall = player.setQueueAsync.mock.invocationCallOrder[0];
      const shuffleCall = player.setShuffle.mock.invocationCallOrder[0];
      expect(queueCall).toBeLessThan(shuffleCall);
      expect(player.setShuffle).toHaveBeenCalledWith(true);
      expect(player.setQueueAsync.mock.calls[0][0]).toHaveLength(2);
      expect(player.play).toHaveBeenCalled();
    });

    it('should report the failure message instead of throwing', async () => {
      player.setQueueAsync.mockRejectedValue(new Error('bridge down'));

      const result = await startShuffled([track('a')]);

      expect(result).toEqual({ ok: false, message: 'bridge down' });
    });
  });
});
