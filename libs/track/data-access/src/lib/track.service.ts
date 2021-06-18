import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApplyLyrics } from '@metal-p3/album/domain';
import { AlbumDto, MetalArchivesAlbumTrack, RenameTrack, Track } from '@metal-p3/api-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TrackService {
  readonly baseUrl = '/api/track';
  constructor(private http: HttpClient) {}

  getTrack(file: string): Observable<Track> {
    return this.http.get<Track>(`/api/trackDetails?file=${encodeURIComponent(file)}`);
  }

  getTracks(folder: string): Observable<Track[]> {
    return this.http.get<Track[]>(`/api/album/tracks?folder=${encodeURIComponent(folder)}`);
  }

  saveTrack(track: Track): Observable<never> {
    return this.http.patch<never>(this.baseUrl, track);
  }

  getMaTracks(url: string): Observable<MetalArchivesAlbumTrack[]> {
    return this.http.get<MetalArchivesAlbumTrack[]>(`/api/album/maTracks?url=${encodeURI(url)}`);
  }

  getLyrics(trackId: number): Observable<string> {
    return this.http.get(`/api/album/getLyrics?trackId=${trackId}`, { responseType: 'text' });
  }

  applyLyrics(id: number, lyrics: ApplyLyrics): Observable<AlbumDto> {
    return this.http.patch<AlbumDto>('/api/applyLyrics', { id, lyrics });
  }

  renameTrack(track: Track): Observable<RenameTrack> {
    return this.http.patch<RenameTrack>(`${this.baseUrl}/rename`, track);
  }

  transferTrack(file: string): Observable<never> {
    return this.http.get<never>(`${this.baseUrl}/transferTrack?file=${encodeURIComponent(file)}`);
  }

  playTrack(file: string): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/playTrack?file=${encodeURIComponent(file)}`, { responseType: 'blob' });
  }
}
