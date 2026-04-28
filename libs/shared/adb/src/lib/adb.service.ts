import Adb, { Device } from '@devicefarmer/adbkit';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { networkInterfaces } from 'os';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

@Injectable()
export class AdbService {
  private readonly adbPath = process.env['ADB_PATH'] ?? 'C://platform-tools//adb.exe';
  private readonly client = Adb.createClient({ bin: this.adbPath, port: 5037 });

  constructor(private readonly fileSystemService: FileSystemService) {}

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
      const dest = `/storage/emulated/0/Music/${this.fileSystemService.getParentFoler(file)}/${this.fileSystemService.getFilename(file)}`;
      const devices = await this.getDevices();

      await Promise.all(
        devices.map(async (device: Device) => {
          const deviceClient = this.client.getDevice(device.id);
          const transfer = await deviceClient.push(file, dest);
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

  isWifiConnected(): boolean {
    const interfaces = networkInterfaces();
    return Object.entries(interfaces).some(([name, addrs]) => {
      const isWifi = /wi.?fi|wlan|wlp/i.test(name);
      return isWifi && (addrs ?? []).some((a) => !a.internal && a.family === 'IPv4');
    });
  }
}
