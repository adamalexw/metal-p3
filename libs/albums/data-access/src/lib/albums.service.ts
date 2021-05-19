import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApplyLyrics, SearchRequest } from '@metal-p3/albums/domain';
import { AlbumDto, BandDto, MetalArchivesAlbumTrack, MetalArchivesSearchResponse, Track } from '@metal-p3/api-interfaces';
import { environment } from '@metal-p3/env';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AlbumsService {
  constructor(private http: HttpClient) {}

  getFolders(): Observable<string[]> {
    return this.http.get<string[]>(`/api/folders?folder=${environment.baseFolderLocation}`);
  }

  getAlbums(request: Partial<SearchRequest>): Observable<AlbumDto[]> {
    return this.http.get<AlbumDto[]>('/api/album/search', { params: new HttpParams({ fromObject: request }) });
  }

  getAlbum(id: number): Observable<AlbumDto> {
    return this.http.get<AlbumDto>(`/api/album?id=${id}`);
  }

  addNewAlbum(folder: string): Observable<AlbumDto> {
    return this.http.post<AlbumDto>('/api/album', { folder });
  }

  getCover(location: string): Observable<string> {
    return this.http.get(`/api/cover?location=${location}`, { responseType: 'text' }).pipe(
      filter(Boolean),
      map((cover) => `data:image/png;base64,${cover}`)
    );
  }

  downloadCover(url: string): Observable<string> {
    return this.http.get(`/api/cover/download?url=${url}`, { responseType: 'text' }).pipe(map((cover) => `data:image/png;base64,${cover}`));
  }

  getTrack(file: string): Observable<Track> {
    return this.http.get<Track>(`/api/trackDetails?file=${file}`);
  }

  getTracks(folder: string): Observable<Track[]> {
    return this.http.get<Track[]>(`/api/album/tracks?folder=${folder}`);
  }

  saveAlbum(album: AlbumDto): Observable<never> {
    return this.http.patch<never>('/api/album', album);
  }

  saveBand(band: BandDto): Observable<never> {
    return this.http.patch<never>('/api/band', band);
  }

  findMaUrl(artist: string, album: string): Observable<MetalArchivesSearchResponse> {
    return this.http.get<MetalArchivesSearchResponse>(`/api/album/findMaUrl?artist=${artist}&album=${album}`);
  }

  getMaTracks(url: string): Observable<MetalArchivesAlbumTrack[]> {
    return this.http.get<MetalArchivesAlbumTrack[]>(`/api/album/maTracks?url=${encodeURI(url)}`);
  }

  saveTrack(track: Track): Observable<never> {
    return this.http.patch<never>('/api/track', track);
  }

  getLyrics(trackId: number): Observable<string> {
    return this.http.get(`/api/album/getLyrics?trackId=${trackId}`, { responseType: 'text' });
  }

  applyLyrics(id: number, lyrics: ApplyLyrics): Observable<AlbumDto> {
    return this.http.patch<AlbumDto>('/api/applyLyrics', { id, lyrics });
  }

  openFolder(folder: string): Observable<never> {
    return this.http.get<never>(`/api/album/openFolder?folder=${folder}`);
  }
}
