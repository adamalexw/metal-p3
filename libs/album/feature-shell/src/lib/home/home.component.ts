import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { viewAlbum } from '@metal-p3/shared/data-access';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  @ViewChild('sidenav') sideNav!: MatSidenav;

  constructor(private store: Store) {}

  onOpenAlbum(id: number) {
    this.sideNav.open();
    this.store.dispatch(viewAlbum({ id }));
  }

  onCloseAlbum() {
    this.sideNav.close();
    this.store.dispatch(viewAlbum({ id: 0 }));
  }
}
