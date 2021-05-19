import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-cover',
  templateUrl: './cover.component.html',
  styleUrls: ['./cover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverComponent {
  @Input()
  loading = false;

  @Input()
  cover: string | undefined;

  @Input()
  width = 250;

  @Input()
  height = 250;

  @Output()
  coverUrl = new EventEmitter<string>();
}
