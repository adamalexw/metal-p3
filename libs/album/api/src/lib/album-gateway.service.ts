import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(3000)
export class AlbumGateway {
  newAlbums: string[] = [];

  @WebSocketServer() server: Server;

  albumAddedMessage(album: string) {
    this.server.emit('albumAdded', album);
  }

  @SubscribeMessage('albumAddedComplete')
  albumAddedComplete(client: Socket, album: string) {
    this.newAlbums = this.newAlbums.filter((a) => a !== album);
  }
}
