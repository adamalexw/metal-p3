import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';

const config: SocketIoConfig = { url: 'http://localhost:3000', options: { transports: ['websocket'] } };

@NgModule({
  imports: [CommonModule, HttpClientModule, SocketIoModule.forRoot(config)],
})
export class AlbumDataAccessModule {}
