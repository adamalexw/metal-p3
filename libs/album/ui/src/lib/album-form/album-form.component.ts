/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { ControlContainer, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { AlbumDataAccessModule } from '@metal-p3/album/data-access';
import { AlbumDetailsForm } from '@metal-p3/album/domain';
import { CoverComponent } from '@metal-p3/cover/ui';
import { TitleCaseDirective } from '@metal-p3/shared/title-case';
import { TracksComponent, TracksToolbarComponent } from '@metal-p3/track/ui';
import { WINDOW } from '@ng-web-apis/common';
import { AlbumToolbarComponent } from '../album-toolbar/album-toolbar.component';

@Component({
  standalone: true,
  imports: [
    AlbumDataAccessModule,
    AlbumToolbarComponent,
    CoverComponent,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    ReactiveFormsModule,
    RouterModule,
    TitleCaseDirective,
    TracksComponent,
    TracksToolbarComponent,
  ],
  selector: 'app-album-form',
  templateUrl: './album-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumFormComponent implements OnInit {
  private readonly controlContainer = inject(ControlContainer);
  private readonly windowRef = inject(WINDOW);

  @Output()
  readonly lyricsPriority = new EventEmitter<void>();

  @Output()
  readonly findBandProps = new EventEmitter<string>();

  get albumUrl(): string | undefined {
    return this.form.controls.albumUrl.value;
  }

  get artistUrl(): string | undefined {
    return this.form.controls.artistUrl.value;
  }

  get hasLyrics(): boolean {
    return this.form.controls.hasLyrics.value ?? false;
  }

  protected form!: FormGroup<AlbumDetailsForm>;

  ngOnInit(): void {
    this.form = this.controlContainer.control!.get('details') as FormGroup<AlbumDetailsForm>;
  }

  openLink(url: string) {
    this.windowRef.open(url, '_blank');
  }

  getBandProps(url: string) {
    this.findBandProps.emit(url);
  }
}
