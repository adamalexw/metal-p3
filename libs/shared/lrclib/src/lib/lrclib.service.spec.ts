import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { firstValueFrom, of, throwError } from 'rxjs';
import { LrcLibService } from './lrclib.service';

function axiosResponse<T>(data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
}

function axios404(): AxiosError {
  const err = new AxiosError('Request failed with status code 404');
  err.response = axiosResponse(null, 404) as unknown as AxiosResponse;
  return err;
}

describe('LrcLibService', () => {
  let service: LrcLibService;
  let httpGet: jest.Mock;

  beforeEach(async () => {
    httpGet = jest.fn();
    const moduleRef = await Test.createTestingModule({
      providers: [LrcLibService, { provide: HttpService, useValue: { get: httpGet } }],
    }).compile();
    service = moduleRef.get(LrcLibService);
  });

  it('returns synced + plain lyrics on a successful response', async () => {
    httpGet.mockReturnValue(
      of(
        axiosResponse({
          id: 1,
          trackName: 'The Trooper',
          artistName: 'Iron Maiden',
          albumName: 'Piece of Mind',
          duration: 251,
          instrumental: false,
          plainLyrics: 'plain text',
          syncedLyrics: '[00:01.00] line one',
        }),
      ),
    );

    const result = await firstValueFrom(
      service.getSyncedLyrics({ artistName: 'Iron Maiden', trackName: 'The Trooper', albumName: 'Piece of Mind', durationSeconds: 251 }),
    );

    expect(result).toEqual({ syncedLyrics: '[00:01.00] line one', plainLyrics: 'plain text', instrumental: false });
    expect(httpGet).toHaveBeenCalledTimes(1);
    const [url, opts] = httpGet.mock.calls[0];
    expect(url).toContain('artist_name=Iron+Maiden');
    expect(url).toContain('track_name=The+Trooper');
    expect(url).toContain('album_name=Piece+of+Mind');
    expect(url).toContain('duration=251');
    expect(opts.headers['User-Agent']).toContain('metal-p3');
  });

  it('returns null when lrclib responds with 404', async () => {
    httpGet.mockReturnValue(throwError(() => axios404()));

    const result = await firstValueFrom(
      service.getSyncedLyrics({ artistName: 'Foo', trackName: 'Bar', albumName: 'Baz' }),
    );

    expect(result).toBeNull();
  });

  it('returns null when lrclib request errors at network level', async () => {
    httpGet.mockReturnValue(throwError(() => new AxiosError('Network down')));

    const result = await firstValueFrom(
      service.getSyncedLyrics({ artistName: 'Foo', trackName: 'Bar', albumName: 'Baz' }),
    );

    expect(result).toBeNull();
  });

  it('throws BadRequestException when a required input is missing', () => {
    expect(() => service.getSyncedLyrics({ artistName: '', trackName: 'Bar', albumName: 'Baz' })).toThrow(BadRequestException);
    expect(() => service.getSyncedLyrics({ artistName: 'Foo', trackName: '   ', albumName: 'Baz' })).toThrow(BadRequestException);
    expect(() => service.getSyncedLyrics({ artistName: 'Foo', trackName: 'Bar', albumName: '' })).toThrow(BadRequestException);
  });

  it('omits duration from the query when not provided', async () => {
    httpGet.mockReturnValue(
      of(
        axiosResponse({
          id: 2,
          trackName: 't',
          artistName: 'a',
          albumName: 'b',
          duration: 0,
          instrumental: true,
          plainLyrics: null,
          syncedLyrics: null,
        }),
      ),
    );

    await firstValueFrom(service.getSyncedLyrics({ artistName: 'a', trackName: 't', albumName: 'b' }));

    const [url] = httpGet.mock.calls[0];
    expect(url).not.toContain('duration=');
  });

  it('normalises blank lyrics fields to null and preserves the instrumental flag', async () => {
    httpGet.mockReturnValue(
      of(
        axiosResponse({
          id: 3,
          trackName: 't',
          artistName: 'a',
          albumName: 'b',
          duration: 100,
          instrumental: true,
          plainLyrics: '   ',
          syncedLyrics: '',
        }),
      ),
    );

    const result = await firstValueFrom(service.getSyncedLyrics({ artistName: 'a', trackName: 't', albumName: 'b' }));

    expect(result).toEqual({ syncedLyrics: null, plainLyrics: null, instrumental: true });
  });
});
