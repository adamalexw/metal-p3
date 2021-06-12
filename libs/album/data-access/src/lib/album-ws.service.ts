import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AlbumWsService {
  constructor(private socket: Socket) {}

  albumAdded(): Observable<string> {
    return this.socket.fromEvent('albumAdded');
  }

  albumAddedComplete(album: string): void {
    this.socket.emit('albumAddedComplete', album);
  }

  getUsers() {
    return this.socket.fromEvent('users');
  }
}
