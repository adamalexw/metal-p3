import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API, ApplyLyrics, BASE_PATH, TAKE } from '@metal-p3/album/domain';
import { ALBUM_ADDED, AlbumDto, MetalArchivesSearchResponse, RenameFolder, SearchRequest, TrackDto } from '@metal-p3/api-interfaces';
import { removeNullValuesFromQueryParams } from '@metal-p3/shared/utils';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AlbumService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API);
  private readonly basePath = inject(BASE_PATH);
  private readonly take = inject(TAKE);
  private readonly socket = inject(Socket);

  private readonly baseUrl = `${this.api}album`;

  getAlbums(request: Partial<SearchRequest>): Observable<AlbumDto[]> {
    const url = `${this.baseUrl}/search`;
    const params = removeNullValuesFromQueryParams(new HttpParams({ fromObject: { ...request, take: request.take ?? this.take, skip: request.skip ?? 0 } }));

    return this.http.get<AlbumDto[]>(url, { params });
  }

  getAlbum(id: number): Observable<AlbumDto> {
    return this.http.get<AlbumDto>(`${this.baseUrl}/${id}`);
  }

  addNewAlbum(folder: string): Observable<AlbumDto> {
    return this.http.post<AlbumDto>(this.baseUrl, { folder });
  }

  getExtraFiles(folder: string): Observable<boolean> {
    return this.http.get<string>(`${this.baseUrl}/extraFiles?folder=${encodeURIComponent(folder)}`, { responseType: 'text' as 'json' }).pipe(map((response) => /true/i.test(response)));
  }

  saveAlbum(album: AlbumDto): Observable<void> {
    return this.http.patch<void>(this.baseUrl, album);
  }

  setHasLyrics(id: number, hasLyrics: boolean): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/setHasLyrics?id=${id}&hasLyrics=${hasLyrics}`, {});
  }

  setTransferred(id: number, transferred: boolean): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/setTransferred?id=${id}&transferred=${transferred}`, {});
  }

  findMaUrl(artist: string, album: string): Observable<MetalArchivesSearchResponse> {
    return this.http.get<MetalArchivesSearchResponse>(`${this.baseUrl}/findMaUrl?artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}`);
  }

  getLyrics(trackId: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/getLyrics?trackId=${trackId}`, { responseType: 'text' });
  }

  applyLyrics(id: number, lyrics: ApplyLyrics): Observable<AlbumDto> {
    return this.http.patch<AlbumDto>(`${this.api}applyLyrics`, { id, lyrics });
  }

  renameTrack(track: TrackDto): Observable<string> {
    return this.http.patch<string>(`${this.api}track/rename`, track, { responseType: 'text' as 'json' });
  }

  renameFolder(id: number, src: string, dest: string): Observable<RenameFolder> {
    return this.http.get<RenameFolder>(`${this.baseUrl}/rename?id=${id}&src=${encodeURIComponent(src)}&dest=${encodeURIComponent(dest)}`);
  }

  openFolder(folder: string): Observable<void> {
    return this.http.get<void>(`${this.baseUrl}/openFolder?folder=${encodeURIComponent(folder)}`);
  }

  createAlbumFromRootFiles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/createAlbumFromRootFiles?folder=${encodeURIComponent(this.basePath)}`);
  }

  albumAdded(): Observable<string> {
    return this.socket.fromEvent(ALBUM_ADDED);
  }

  deleteAlbum(id: number) {
    return this.http.delete(`${this.baseUrl}?id=${id}`);
  }
}
