import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-extra-files',
  templateUrl: './extra-files.component.html',
  styleUrls: ['./extra-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtraFilesComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
