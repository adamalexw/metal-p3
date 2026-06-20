import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TimePipe } from '@metal-p3/track/util';

@Component({
  imports: [NgTemplateOutlet, MatToolbarModule, MatButtonModule, MatIconModule, TimePipe],
  selector: 'app-tracks-toolbar',
  templateUrl: './tracks-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksToolbarComponent {
  readonly gettingMaTracks = input(false);
  readonly trackRenaming = input(false);
  readonly enableMaActions = input(false);
  readonly lyricsLoading = input(false);
  readonly albumDuration = input(0);

  readonly trackNumbers = output<void>();
  readonly renameTracks = output<void>();
  readonly maTracks = output<void>();
  readonly lyrics = output<void>();
  readonly refreshTracks = output<void>();
  readonly playAlbum = output<void>();
  readonly addAlbumToPlaylist = output<void>();
}
