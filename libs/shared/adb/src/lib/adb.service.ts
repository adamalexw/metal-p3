import Adb, { Device } from '@devicefarmer/adbkit';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { networkInterfaces } from 'os';
import { basename, dirname, extname, join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

@Injectable()
export class AdbService {
  private readonly adbPath: string;
  private readonly client: ReturnType<typeof Adb.createClient>;

  constructor(private readonly fileSystemService: FileSystemService) {
    const sdkRoot = process.env['ANDROID_SDK_ROOT'] ?? process.env['ANDROID_HOME'];
    this.adbPath = sdkRoot ? join(sdkRoot, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb') : 'adb';
    this.client = Adb.createClient({ bin: this.adbPath, port: 5037 });
  }

  async getDevices(): Promise<Device[]> {
    const devices = await this.client.listDevices();

    if (!devices.length) {
      return Promise.reject(new Error('no devices connected'));
    }

    const onlineDevices = devices.filter((d: Device) => ['device', 'emulator'].includes(d.type));

    return onlineDevices;
  }

  async pairDevice(host: string, port: number, code: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync(this.adbPath, ['pair', `${host}:${port}`, code]);
      return stdout.trim();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Pairing failed:', err.message);
        return Promise.reject(new Error(err.message));
      }
      console.error('Pairing failed:', err);
      return Promise.reject(new Error('Pairing failed'));
    }
  }

  async connectPhone(host: string, port: number): Promise<string> {
    try {
      const connected = await this.client.connect(host, port);
      return connected ? `connected to ${host}:${port}` : `already connected to ${host}:${port}`;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Connection failed:', err.message);
        return Promise.reject(new Error(err.message));
      }
      console.error('Connection failed:', err);
      return Promise.reject(new Error('Connection failed'));
    }
  }

  async transferFile(file: string) {
    try {
      const parentFolder = this.fileSystemService.getParentFoler(file);
      const filename = this.fileSystemService.getFilename(file);
      const dest = `/storage/emulated/0/Music/${parentFolder}/${filename}`;

      const lrcStem = basename(file, extname(file));
      const lrcSrc = join(dirname(file), `${lrcStem}.lrc`);
      const hasSidecar = existsSync(lrcSrc);
      const lrcDest = hasSidecar ? `/storage/emulated/0/Music/${parentFolder}/${lrcStem}.lrc` : null;

      const devices = await this.getDevices();

      await Promise.all(
        devices.map(async (device: Device) => {
          const deviceClient = this.client.getDevice(device.id);
          await this.pushAndScan(deviceClient, file, dest);
          if (lrcDest) {
            await this.pushAndScan(deviceClient, lrcSrc, lrcDest);
          }
        }),
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Something went wrong:', err.stack);
        return Promise.reject(new Error(err.stack));
      }
      console.error('Something went wrong:', err);
      return Promise.reject(new Error('Something went wrong'));
    }
  }

  private async pushAndScan(deviceClient: ReturnType<ReturnType<typeof Adb.createClient>['getDevice']>, src: string, dest: string): Promise<void> {
    const transfer = await deviceClient.push(src, dest);
    await new Promise<void>((resolve, reject) => {
      transfer.on('end', () => {
        const command = `am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d "file://${dest}"`;
        deviceClient
          .shell(command)
          .then(() => resolve())
          .catch(reject);
      });
      transfer.on('error', reject);
    });
  }

  isWifiConnected(): boolean {
    const interfaces = networkInterfaces();
    return Object.entries(interfaces).some(([name, addrs]) => {
      const isWifi = /wi.?fi|wlan|wlp/i.test(name);
      return isWifi && (addrs ?? []).some((a) => !a.internal && a.family === 'IPv4');
    });
  }
}
