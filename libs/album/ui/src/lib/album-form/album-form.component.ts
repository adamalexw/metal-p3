/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChangeDetectionStrategy, Component, OnInit, inject, output } from '@angular/core';
import { ControlContainer, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { AlbumDetailsForm } from '@metal-p3/album/domain';
import { TitleCaseDirective } from '@metal-p3/shared/title-case';
import { WA_WINDOW } from '@ng-web-apis/common';

@Component({
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, ReactiveFormsModule, RouterModule, TitleCaseDirective],
  selector: 'app-album-form',
  templateUrl: './album-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumFormComponent implements OnInit {
  private readonly controlContainer = inject(ControlContainer);
  private readonly windowRef = inject(WA_WINDOW);

  readonly lyricsPriority = output<void>();
  readonly findBandProps = output<string>();

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
