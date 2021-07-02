import { LyricsHistoryDto } from '@metal-p3/maintenance/domain';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway(3000)
export class MaintenanceGateway {
  @WebSocketServer() server: Server;

  lyricsHistoryMessage(lyricsHistory: LyricsHistoryDto) {
    this.server.emit('lyricsHistoryUpdate', lyricsHistory);
  }

  lyricsHistoryComplete() {
    this.server.emit('lyricsHistoryComplete', true);
  }
}
