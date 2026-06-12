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
    'Save Tracks': props<{ id: number; tracks: Track[] }>(),
    'Save Tracks Success': props<{ id: number; tracks: Track[] }>(),
    'Save Tracks Error': props<{ id: number; tracks: Track[]; error: string }>(),
    'Rename Track': props<{ id: number; track: Track }>(),
    'Rename Track Success': props<{ id: number; trackId: number; file: string; fullPath: string }>(),
    'Rename Track Error': props<{ id: number; trackId: number; error: string }>(),
    'Transfer Track': props<{ id: number; trackId: number }>(),
    'Transfer Track Success': props<{ id: number; track: Track }>(),
    'Transfer Track Error': props<{ id: number; track: Track }>(),
    'Update Tracks Success': props<{ id: number; updates: Update<Track>[] }>(),
    'Get Metal Archives Tracks': props<{ id: number; url: string }>(),
    'Get Metal Archives Tracks Success': props<{ id: number; maTracks: MetalArchivesAlbumTrack[] }>(),
    'Get Metal Archives Tracks Error': props<{ id: number }>(),
    'Get Lyrics': props<{ id: number; trackId: string }>(),
    'Get Lyrics Success': props<{ id: number; trackId: string; lyrics: string }>(),
    'Get Lyrics Error': props<{ id: number; trackId: string; error: string }>(),
    'Get Synced Lyrics': props<{ id: number; localTrackId: number; maTrackId: string; artist: string; track: string; album: string; durationSeconds?: number }>(),
    'Get Synced Lyrics Success': props<{ id: number; localTrackId: number; maTrackId: string; syncedLyrics: string }>(),
    'Get Synced Lyrics Miss': props<{ id: number; localTrackId: number; maTrackId: string }>(),
    'Get Local Lyrics': props<{ id: number; localTrackId: number; artist: string; track: string; album: string; durationSeconds?: number }>(),
    'Get Local Lyrics Success': props<{ id: number; localTrackId: number; syncedLyrics: string | null; plainLyrics: string | null }>(),
    'Get Local Lyrics Miss': props<{ id: number; localTrackId: number }>(),
    'Apply Lyrics': props<{ id: number; lyrics: ApplyLyrics[] }>(),
    'Apply Lyrics Success': props<{ update: Update<Album> }>(),
    'Delete Track': props<{ id: number; track: Track }>(),
    'Delete Track Success': props<{ id: number; track: Track }>(),
    'Delete Track Error': props<{ id: number; trackId: number; error: string }>(),
  },
});
