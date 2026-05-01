import { ALBUM_ADDED, AlbumDto } from '@metal-p3/api-interfaces';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class AlbumGateway {
  @WebSocketServer() server!: Server;

  albumAddedMessage(album: AlbumDto) {
    this.server.emit(ALBUM_ADDED, album);
  }
}
