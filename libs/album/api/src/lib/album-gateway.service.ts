import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(3000)
export class AlbumGateway implements OnGatewayConnection, OnGatewayDisconnect {
  newAlbums: string[] = [];

  @WebSocketServer() server: Server;
  users = 0;

  handleConnection() {
    // A client has connected
    this.users++;

    // Notify connected clients of current users
    this.server.emit('users', this.users);
  }

  handleDisconnect() {
    // A client has disconnected
    this.users--;
    // Notify connected clients of current users
    this.server.emit('users', this.users);
  }

  albumAddedMessage(album: string) {
    this.server.emit('albumAdded', album);
  }

  @SubscribeMessage('albumAddedComplete')
  albumAddedComplete(client: Socket, album: string) {
    this.newAlbums = this.newAlbums.filter((a) => a !== album);
  }
}
