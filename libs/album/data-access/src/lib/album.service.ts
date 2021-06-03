import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { ApplyLyrics, BASE_PATH, SearchRequest } from '@metal-p3/album/domain';
import { AlbumDto, BandProps, MetalArchivesSearchResponse, RenameFolder, Track } from '@metal-p3/api-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AlbumService {
  readonly baseUrl = '/api/album';

  constructor(private http: HttpClient, @Inject(BASE_PATH) private readonly basePath: string) {}

  getFolders(): Observable<string[]> {
    return this.http.get<string[]>(`/api/folders?folder=${this.basePath}`);
  }

  getAlbums(request: Partial<SearchRequest>): Observable<AlbumDto[]> {
    return this.http.get<AlbumDto[]>(`${this.baseUrl}/search`, { params: new HttpParams({ fromObject: request }) });
  }

  getAlbum(id: number): Observable<AlbumDto> {
    return this.http.get<AlbumDto>(`${this.baseUrl}/search?id=${id}`);
  }

  addNewAlbum(folder: string): Observable<AlbumDto> {
    return this.http.post<AlbumDto>(this.baseUrl, { folder });
  }

  getTrack(file: string): Observable<Track> {
    return this.http.get<Track>(`/api/trackDetails?file=${file}`);
  }

  getTracks(folder: string): Observable<Track[]> {
    return this.http.get<Track[]>(`${this.baseUrl}/tracks?folder=${folder}`);
  }

  saveAlbum(album: AlbumDto): Observable<never> {
    return this.http.patch<never>(this.baseUrl, album);
  }

  findMaUrl(artist: string, album: string): Observable<MetalArchivesSearchResponse> {
    return this.http.get<MetalArchivesSearchResponse>(`${this.baseUrl}/findMaUrl?artist=${artist}&album=${album}`);
  }

  getLyrics(trackId: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/getLyrics?trackId=${trackId}`, { responseType: 'text' });
  }

  applyLyrics(id: number, lyrics: ApplyLyrics): Observable<AlbumDto> {
    return this.http.patch<AlbumDto>('/api/applyLyrics', { id, lyrics });
  }

  renameTrack(track: Track): Observable<string> {
    return this.http.patch<string>('/api/track/rename', track, { responseType: 'text' as 'json' });
  }

  renameFolder(id: number, src: string, dest: string): Observable<RenameFolder> {
    return this.http.get<RenameFolder>(`${this.baseUrl}/rename?id=${id}&src=${encodeURIComponent(src)}&dest=${encodeURIComponent(dest)}`);
  }

  openFolder(folder: string): Observable<never> {
    return this.http.get<never>(`${this.baseUrl}/openFolder?folder=${folder}`);
  }

  getBandProps(url: string): Observable<BandProps> {
    return this.http.get<BandProps>(`/api/band/props?url=${encodeURIComponent(url)}`);
  }

  transferTrack(file: string): Observable<never> {
    return this.http.get<never>(`/api/track/transferTrack?file=${file}`);
  }

  createAlbumFromRootFiles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/createAlbumFromRootFiles?folder=${encodeURIComponent(this.basePath)}`);
  }
}
