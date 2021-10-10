import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { API, ApplyLyrics } from '@metal-p3/album/domain';
import { AlbumDto, MetalArchivesAlbumTrack, RenameTrack, TrackDto } from '@metal-p3/api-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TrackService {
  readonly baseUrl = `${this.api}track`;
  readonly albumUrl = `${this.api}album`;

  constructor(private http: HttpClient, @Inject(API) private api: string) {}

  getTrack(file: string): Observable<TrackDto> {
    return this.http.get<TrackDto>(`${this.baseUrl}/trackDetails?file=${encodeURIComponent(file)}`);
  }

  getTracks(folder: string): Observable<TrackDto[]> {
    return this.http.get<TrackDto[]>(`${this.albumUrl}/tracks?folder=${encodeURIComponent(folder)}`);
  }

  saveTrack(track: TrackDto): Observable<never> {
    return this.http.patch<never>(this.baseUrl, track);
  }

  getMaTracks(url: string): Observable<MetalArchivesAlbumTrack[]> {
    return this.http.get<MetalArchivesAlbumTrack[]>(`${this.albumUrl}/maTracks?url=${encodeURI(url)}`);
  }

  getLyrics(trackId: number): Observable<string> {
    return this.http.get(`${this.albumUrl}/getLyrics?trackId=${trackId}`, { responseType: 'text' });
  }

  applyLyrics(id: number, lyrics: ApplyLyrics): Observable<AlbumDto> {
    return this.http.patch<AlbumDto>(`${this.api}/applyLyrics`, { id, lyrics });
  }

  renameTrack(track: TrackDto): Observable<RenameTrack> {
    return this.http.patch<RenameTrack>(`${this.baseUrl}/rename`, track);
  }

  transferTrack(file: string): Observable<never> {
    return this.http.get<never>(`${this.baseUrl}/transferTrack?file=${encodeURIComponent(file)}`);
  }

  playTrack(file: string): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/playTrack?file=${encodeURIComponent(file)}`, { responseType: 'blob' });
  }

  deleteTrack(file: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}?file=${encodeURIComponent(file)}`);
  }
}
