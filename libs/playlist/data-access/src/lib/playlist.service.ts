import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PlaylistDto } from '@metal-p3/playlist/domain';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  readonly baseUrl = '/api/playlist';

  constructor(private http: HttpClient) {}

  getPlaylists(): Observable<PlaylistDto[]> {
    return this.http.get<PlaylistDto[]>(`${this.baseUrl}/list`);
  }

  getPlaylist(playlistId: number): Observable<PlaylistDto> {
    return this.http.get<PlaylistDto>(`${this.baseUrl}?playlistId=${playlistId}`);
  }

  createPlaylist(playlist: PlaylistDto): Observable<PlaylistDto> {
    return this.http.post<PlaylistDto>(this.baseUrl, playlist);
  }

  updatePlaylist(playlist: PlaylistDto): Observable<PlaylistDto> {
    return this.http.put<PlaylistDto>(this.baseUrl, playlist);
  }

  removeItem(playlistItemId: number): Observable<boolean | Error> {
    return this.http.delete<boolean | Error>(`${this.baseUrl}/remove?itemId=${playlistItemId}`, {});
  }

  deletePlaylist(playlistId: number): Observable<boolean | Error> {
    return this.http.delete<boolean | Error>(`${this.baseUrl}?playlistId=${playlistId}`, {});
  }
}
