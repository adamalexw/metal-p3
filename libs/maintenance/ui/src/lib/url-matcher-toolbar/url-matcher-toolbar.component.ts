import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NavToolbarComponent } from '@metal-p3/shared/navigation';

@Component({
  standalone: true,
  imports: [NgIf, NavToolbarComponent, MatIconModule, MatProgressBarModule],
  selector: 'app-url-matcher-toolbar',
  templateUrl: './url-matcher-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlMatcherToolbarComponent {
  @Input()
  getting = false;

  @Input()
  matching: boolean | null | undefined = false;

  @Output()
  readonly startMatching = new EventEmitter<void>();

  @Output()
  readonly stopMatching = new EventEmitter<void>();
}
