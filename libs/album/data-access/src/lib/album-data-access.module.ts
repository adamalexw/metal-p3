import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { SocketIoModule } from 'ngx-socket-io';

@NgModule({
  imports: [CommonModule, HttpClientModule, SocketIoModule],
})
export class AlbumDataAccessModule {}
