import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API, ApplyLyrics } from '@metal-p3/album/domain';
import { AlbumDto, MetalArchivesAlbumTrack, RenameTrack, TrackDto } from '@metal-p3/api-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TrackService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API);

  private readonly baseUrl = `${this.api}track`;
  private readonly albumUrl = `${this.api}album`;

  getTrack(file: string): Observable<TrackDto> {
    return this.http.get<TrackDto>(`${this.baseUrl}/trackDetails?file=${encodeURIComponent(file)}`);
  }

  getTracks(folder: string): Observable<TrackDto[]> {
    return this.http.get<TrackDto[]>(`${this.albumUrl}/tracks?folder=${encodeURIComponent(folder)}`);
  }

  saveTrack(track: TrackDto): Observable<void> {
    return this.http.patch<void>(this.baseUrl, track);
  }

  getMaTracks(url: string): Observable<MetalArchivesAlbumTrack[]> {
    return this.http.get<MetalArchivesAlbumTrack[]>(`${this.albumUrl}/maTracks?url=${encodeURI(url)}`);
  }

  getLyrics(trackId: string): Observable<string> {
    return this.http.get(`${this.albumUrl}/getLyrics?trackId=${trackId}`, { responseType: 'text' });
  }

  applyLyrics(id: number, lyrics: ApplyLyrics): Observable<AlbumDto> {
    return this.http.patch<AlbumDto>(`${this.api}/applyLyrics`, { id, lyrics });
  }

  renameTrack(track: TrackDto): Observable<RenameTrack> {
    return this.http.patch<RenameTrack>(`${this.baseUrl}/rename`, track);
  }

  transferTrack(file: string): Observable<void> {
    return this.http.get<void>(`${this.baseUrl}/transferTrack?file=${encodeURIComponent(file)}`);
  }

  playTrack(file: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/playTrack?file=${encodeURIComponent(file)}`, { responseType: 'blob' });
  }

  deleteTrack(file: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}?file=${encodeURIComponent(file)}`);
  }
}
