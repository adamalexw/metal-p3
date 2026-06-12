import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { AlbumDetailsForm } from '@metal-p3/album/domain';
import { TitleCaseDirective } from '@metal-p3/shared/title-case';
import { CountryFlagPipe } from '@metal-p3/shared/utils';
import { WA_WINDOW } from '@ng-web-apis/common';

@Component({
  imports: [CountryFlagPipe, FormField, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule, RouterModule, TitleCaseDirective],
  selector: 'app-album-form',
  templateUrl: './album-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumFormComponent {
  private readonly windowRef = inject(WA_WINDOW);

  readonly field = input.required<FieldTree<AlbumDetailsForm>>();

  readonly lyricsPriority = output<void>();
  readonly findBandProps = output<string>();
  readonly identifyBand = output<void>();

  openLink(url: string) {
    this.windowRef.open(url, '_blank');
  }

  getBandProps(url: string) {
    this.findBandProps.emit(url);
  }
}
