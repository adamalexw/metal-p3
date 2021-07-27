export interface PlaylistDto {
  id: number;
  name: string;
  items: PlaylistItemDto[];
}

export interface PlaylistItemDto {
  id: number;
  playlistId: number;
  itemPath: string;
  itemIndex: number;
}
