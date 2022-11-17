import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { AlbumDataAccessModule } from '@metal-p3/album/data-access';
import { CoverComponent } from '@metal-p3/cover/ui';
import { TracksComponent, TracksToolbarComponent } from '@metal-p3/track/ui';
import { WINDOW } from '@ng-web-apis/common';
import { AlbumToolbarComponent } from '../album-toolbar/album-toolbar.component';

@Component({
  standalone: true,
  imports: [
    NgIf,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    AlbumDataAccessModule,
    AlbumToolbarComponent,
    CoverComponent,
    TracksToolbarComponent,
    TracksComponent,
    MatProgressBarModule,
    MatListModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
  ],
  selector: 'app-album-form',
  templateUrl: './album-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumFormComponent {
  @Input()
  form!: FormGroup;

  @Output()
  readonly lyricsPriority = new EventEmitter<void>();

  @Output()
  readonly findBandProps = new EventEmitter<string>();

  get albumUrl(): string {
    return this.form.get('albumUrl')?.value;
  }

  get artistUrl(): string {
    return this.form.get('artistUrl')?.value;
  }

  get hasLyrics(): boolean {
    return this.form.get('hasLyrics')?.value;
  }

  constructor(@Inject(WINDOW) readonly windowRef: Window) {}

  openLink(url: string) {
    this.windowRef.open(url, '_blank');
  }

  getBandProps(url: string) {
    this.findBandProps.emit(url);
  }
}
