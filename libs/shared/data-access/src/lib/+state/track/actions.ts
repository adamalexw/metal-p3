import { ApplyLyrics } from '@metal-p3/album/domain';
import { MetalArchivesAlbumTrack } from '@metal-p3/api-interfaces';
import { Track } from '@metal-p3/track/domain';
import { Update } from '@ngrx/entity';
import { createActionGroup, props } from '@ngrx/store';
import { Album } from '../model';

export const TrackActions = createActionGroup({
  source: 'Track',
  events: {
    'Get Tracks': props<{ id: number; folder: string }>(),
    'Get Tracks Success': props<{ id: number; tracks: Track[] }>(),
    'Get Tracks Error': props<{ id: number; error: string }>(),
    'Save Track': props<{ id: number; track: Track }>(),
    'Save Track Success': props<{ id: number; track: Track }>(),
    'Rename Track': props<{ id: number; track: Track }>(),
    'Rename Track Success': props<{ id: number; trackId: number; file: string; fullPath: string }>(),
    'Transfer Track': props<{ id: number; trackId: number }>(),
    'Transfer Track Success': props<{ id: number; track: Track }>(),
    'Update Tracks Success': props<{ id: number; updates: Update<Track>[] }>(),
    'Get Metal Archives Tracks': props<{ id: number; url: string }>(),
    'Get Metal Archives Tracks Success': props<{ id: number; maTracks: MetalArchivesAlbumTrack[] }>(),
    'Get Lyrics': props<{ id: number; trackId: string }>(),
    'Get Lyrics Success': props<{ id: number; trackId: string; lyrics: string }>(),
    'Get Lyrics Error': props<{ id: number; trackId: string; error: string }>(),
    'Apply Lyrics': props<{ id: number; lyrics: ApplyLyrics[] }>(),
    'Apply Lyrics Success': props<{ update: Update<Album> }>(),
    'Delete Track': props<{ id: number; track: Track }>(),
    'Delete Track Success': props<{ id: number; track: Track }>(),
    'Delete Track Error': props<{ id: number; trackId: number; error: string }>(),
  },
});
