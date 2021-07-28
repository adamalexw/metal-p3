import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-cover',
  templateUrl: './cover.component.html',
  styleUrls: ['./cover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverComponent {
  @Input()
  loading: boolean | null = false;

  @Input()
  cover: string | null | undefined;

  @Input()
  coverError: string | undefined;

  @Input()
  width: number | null = 270;

  @Input()
  height: number | null = 270;

  @Input()
  enableDnd = false;

  @Output()
  coverUrl = new EventEmitter<string>();
}
