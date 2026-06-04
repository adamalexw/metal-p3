import { ImportedSetlist, ResolvedTrack } from '@metal-p3/setlist-importer/domain';
import { PlaylistDto } from '@metal-p3/playlist/domain';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const SetlistImporterActions = createActionGroup({
  source: 'Setlist Importer',
  events: {
    'Set Urls': props<{ urls: string[] }>(),
    Scrape: emptyProps(),
    'Scrape Success': props<{ setlists: ImportedSetlist[] }>(),
    'Scrape Error': props<{ error: string }>(),
    Match: emptyProps(),
    'Match Success': props<{ tracks: ResolvedTrack[] }>(),
    'Match Error': props<{ error: string }>(),
    'Toggle Track Selection': props<{ key: string }>(),
    'Set All Selection': props<{ selected: boolean }>(),
    'Create Playlist': props<{ name: string }>(),
    'Create Playlist Success': props<{ playlist: PlaylistDto }>(),
    'Create Playlist Error': props<{ error: string }>(),
    Reset: emptyProps(),
  },
});
