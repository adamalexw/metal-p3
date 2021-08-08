import { EXTRA_FILES, EXTRA_FILES_COMPLETE, LYRICS_HISTORY_COMPLETE, LYRICS_HISTORY_UPDATE, URL_MATCHER, URL_MATCHER_COMPLETE } from '@metal-p3/api-interfaces';
import { LyricsHistoryDto, UrlMatcher } from '@metal-p3/maintenance/domain';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway(3000)
export class MaintenanceGateway {
  @WebSocketServer() server: Server;

  lyricsHistoryMessage(lyricsHistory: LyricsHistoryDto) {
    this.server.emit(LYRICS_HISTORY_UPDATE, lyricsHistory);
  }

  lyricsHistoryComplete() {
    this.server.emit(LYRICS_HISTORY_COMPLETE, true);
  }

  extraFiles(folder: string) {
    this.server.emit(EXTRA_FILES, folder);
  }

  extraFilesComplete() {
    this.server.emit(EXTRA_FILES_COMPLETE, true);
  }

  urlMatcher(matcher: UrlMatcher) {
    this.server.emit(URL_MATCHER, matcher);
  }

  urlMatcherComplete() {
    this.server.emit(URL_MATCHER_COMPLETE, true);
  }
}
