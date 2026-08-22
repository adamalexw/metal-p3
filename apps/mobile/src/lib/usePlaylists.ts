import { useEffect, useState } from 'react';
import { getPlaylists, loadPlaylists, subscribe, type Playlist } from './playlist-store';

export function usePlaylists(): Playlist[] {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => getPlaylists());

  useEffect(() => {
    void loadPlaylists().then((p) => setPlaylists([...p]));
    return subscribe(() => setPlaylists([...getPlaylists()]));
  }, []);

  return playlists;
}
