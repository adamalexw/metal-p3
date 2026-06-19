import { Component } from '@angular/core';
import { HomeComponent } from '@metal-p3/album';

@Component({
  selector: 'app-root',
  imports: [HomeComponent],
  templateUrl: './app.component.html',
  host: {
    class: 'block h-full w-full'
  }
})
export class AppComponent {}
