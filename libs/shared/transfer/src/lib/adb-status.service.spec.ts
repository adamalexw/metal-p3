import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API } from '@metal-p3/album/domain';
import { AdbStatusService } from './adb-status.service';

describe('AdbStatusService', () => {
  let service: AdbStatusService;
  let httpMock: HttpTestingController;

  const expectStatusRequest = () => httpMock.expectOne('api/adb/status');

  beforeEach(() => {
    jest.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API, useValue: 'api/' }],
    });

    service = TestBed.inject(AdbStatusService);
    httpMock = TestBed.inject(HttpTestingController);

    jest.advanceTimersByTime(1);
  });

  afterEach(() => {
    httpMock.verify();
    jest.useRealTimers();
  });

  describe('transferEnabled', () => {
    it('should be true when wifi is up and a device is attached', () => {
      expectStatusRequest().flush({ wifi: true, device: true });

      expect(service.wifiConnected()).toBe(true);
      expect(service.deviceConnected()).toBe(true);
      expect(service.transferEnabled()).toBe(true);
    });

    it('should be false when no device is attached', () => {
      expectStatusRequest().flush({ wifi: true, device: false });

      expect(service.transferEnabled()).toBe(false);
    });

    it('should be false when wifi is down', () => {
      expectStatusRequest().flush({ wifi: false, device: true });

      expect(service.transferEnabled()).toBe(false);
    });

    it('should be false before the first response arrives', () => {
      expect(service.transferEnabled()).toBe(false);

      expectStatusRequest().flush({ wifi: true, device: true });
    });
  });

  describe('polling', () => {
    it('should treat a failed request as disconnected without stopping the poll', () => {
      expectStatusRequest().flush({ wifi: true, device: true });

      jest.advanceTimersByTime(30_000);
      expectStatusRequest().error(new ProgressEvent('network error'));

      expect(service.wifiConnected()).toBe(false);
      expect(service.deviceConnected()).toBe(false);

      jest.advanceTimersByTime(30_000);
      expectStatusRequest().flush({ wifi: true, device: true });

      expect(service.transferEnabled()).toBe(true);
    });
  });

  describe('refresh', () => {
    it('should request the status again without waiting for the next poll', () => {
      expectStatusRequest().flush({ wifi: true, device: false });

      service.refresh();
      expectStatusRequest().flush({ wifi: true, device: true });

      expect(service.transferEnabled()).toBe(true);
    });
  });
});
