import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { TracksForm } from '@metal-p3/track/domain';

export interface AlbumForm {
  details: FormGroup<AlbumDetailsForm>;
  tracks: FormArray<FormGroup<TracksForm>>;
}

export interface AlbumDetailsForm {
  artist: FormControl<string>;
  album: FormControl<string>;
  year: FormControl<number>;
  genre: FormControl<string | undefined>;
  country: FormControl<string | undefined>;
  artistUrl: FormControl<string | undefined>;
  albumUrl: FormControl<string | undefined>;
  ignore: FormControl<boolean>;
  transferred: FormControl<boolean | undefined>;
  hasLyrics: FormControl<boolean | undefined>;
  dateCreated: FormControl<string>;
}
