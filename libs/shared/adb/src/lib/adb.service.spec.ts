import { FileSystemService } from '@metal-p3/shared/file-system';
import { EventEmitter } from 'events';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const pushMock = jest.fn();
const shellMock = jest.fn();
const getDeviceMock = jest.fn();
const listDevicesMock = jest.fn();

jest.mock('@devicefarmer/adbkit', () => ({
  __esModule: true,
  default: {
    createClient: () => ({
      listDevices: listDevicesMock,
      getDevice: getDeviceMock,
      connect: jest.fn(),
    }),
  },
}));

import { AdbService } from './adb.service';

class FakeTransfer extends EventEmitter {
  endAfterTick() {
    setImmediate(() => this.emit('end'));
  }
  errorAfterTick(err: Error) {
    setImmediate(() => this.emit('error', err));
  }
}

describe('AdbService.transferFile', () => {
  let service: AdbService;
  let folder: string;
  let mp3Path: string;
  let lrcPath: string;
  const fileSystem = {
    getParentFoler: (file: string) => file.split(/[\\/]/).slice(-2, -1)[0],
    getFilename: (file: string) => file.split(/[\\/]/).pop() ?? '',
  } as unknown as FileSystemService;

  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), 'metal-p3-adb-'));
    mp3Path = join(folder, '01 - Track.mp3');
    lrcPath = join(folder, '01 - Track.lrc');
    writeFileSync(mp3Path, '');

    pushMock.mockReset();
    shellMock.mockReset().mockResolvedValue(undefined);
    getDeviceMock.mockReset().mockReturnValue({ push: pushMock, shell: shellMock });
    listDevicesMock.mockReset().mockResolvedValue([{ id: 'device-1', type: 'device' }]);

    service = new AdbService(fileSystem);
  });

  afterEach(() => {
    rmSync(folder, { recursive: true, force: true });
  });

  it('pushes only the mp3 when no sidecar exists', async () => {
    const transfer = new FakeTransfer();
    pushMock.mockResolvedValue(transfer);
    transfer.endAfterTick();

    await service.transferFile(mp3Path);

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith(mp3Path, expect.stringContaining('.mp3'));
    expect(shellMock).toHaveBeenCalledTimes(1);
  });

  it('pushes mp3 then lrc when a sidecar is present', async () => {
    writeFileSync(lrcPath, '[00:00.00] hi');
    const transfers = [new FakeTransfer(), new FakeTransfer()];
    pushMock.mockImplementation(() => {
      const next = transfers.shift()!;
      next.endAfterTick();
      return Promise.resolve(next);
    });

    await service.transferFile(mp3Path);

    expect(pushMock).toHaveBeenCalledTimes(2);
    expect(pushMock.mock.calls[0][0]).toBe(mp3Path);
    expect(pushMock.mock.calls[0][1]).toContain('.mp3');
    expect(pushMock.mock.calls[1][0]).toBe(lrcPath);
    expect(pushMock.mock.calls[1][1]).toContain('.lrc');
    expect(shellMock).toHaveBeenCalledTimes(2);
  });

  it('rejects when the lrc push fails after a successful mp3 push', async () => {
    writeFileSync(lrcPath, '[00:00.00] hi');
    const mp3Transfer = new FakeTransfer();
    const lrcTransfer = new FakeTransfer();
    pushMock
      .mockImplementationOnce(() => {
        mp3Transfer.endAfterTick();
        return Promise.resolve(mp3Transfer);
      })
      .mockImplementationOnce(() => {
        lrcTransfer.errorAfterTick(new Error('lrc push failed'));
        return Promise.resolve(lrcTransfer);
      });

    await expect(service.transferFile(mp3Path)).rejects.toThrow();
    expect(pushMock).toHaveBeenCalledTimes(2);
  });
});
