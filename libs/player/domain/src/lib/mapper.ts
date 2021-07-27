import { PlaylistItemDto } from '@metal-p3/playlist/domain';
import { PlaylistItem } from './playlist';

export const playlistItemToDto = (playlistItem: PlaylistItem, playlistId = -1): PlaylistItemDto => {
  return {
    id: playlistItem.playlistItemId ?? -1,
    playlistId,
    itemPath: playlistItem.fullPath ?? '',
    itemIndex: playlistItem.index,
  };
};
