import { useEffect, useState } from 'react';
import { MetalP3Player, type PlaybackState } from '../../modules/metalp3-player';

export function useNowPlayingState(): PlaybackState | null {
  const [state, setState] = useState<PlaybackState | null>(null);

  useEffect(() => {
    let mounted = true;
    void MetalP3Player.getStateAsync().then((s) => mounted && setState(s));
    const sub = MetalP3Player.addStateListener((s) => mounted && setState(s));
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return state;
}
