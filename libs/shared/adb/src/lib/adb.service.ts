import * as Adb from '@devicefarmer/adbkit';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { Injectable } from '@nestjs/common';
import * as Bluebird from 'bluebird';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

@Injectable()
export class AdbService {
  private client: Adb.Client;
  private readonly adbPath = 'C://platform-tools//adb.exe';

  constructor(private readonly fileSystemService: FileSystemService) {
    this.client = new Adb.Client({ bin: this.adbPath, port: 5037 });
  }

  async getDevices(): Promise<Adb.Device[]> {
    const devices = await this.client.listDevices();

    if (!devices.length) {
      return Promise.reject(new Error('no devices connected'));
    }

    const onlineDevices = devices.filter((d: Adb.Device) => ['device', 'emulator'].includes(d.type));

    return onlineDevices;
  }

  async pairDevice(host: string, port: number, code: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync(this.adbPath, ['pair', `${host}:${port}`, code]);
      return stdout.trim();
    } catch (err: any) {
      console.error('Pairing failed:', err.message);
      return Promise.reject(new Error(err.message));
    }
  }

  async connectPhone(host: string, port: number): Promise<string> {
    try {
      const output = await this.client.connect(host, port);
      return Bluebird.resolve(output);
    } catch (err: any) {
      console.error('Connection failed:', err.message);
      return Promise.reject(new Error(err.message));
    }
  }

  async transferFile(file: string) {
    try {
      const dest = `/storage/emulated/0/Music/${this.fileSystemService.getParentFoler(file)}/${this.fileSystemService.getFilename(file)}`;
      const devices = await this.getDevices();

      await Bluebird.map(devices, async (device: Adb.Device) => {
        const deviceClient = this.client.getDevice(device.id);
        const transfer = await deviceClient.push(file, dest);
        await new Bluebird(function (resolve, reject) {
          // transfer.on('progress', (stats) => console.log(`[${device.id}] Pushed ${stats.bytesTransferred} bytes so far`));
          transfer.on('end', () => {
            console.log(`[${device.id}] Push complete`);

            const command = `am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d "file://${dest}"`;
            deviceClient
              .shell(command)
              .then(Adb.Adb.util.readAll)
              .then(function (output: any) {
                console.log('[%s] %s', device.id, output.toString().trim());
              })
              .then(() => resolve())
              .catch(reject);
          });
          transfer.on('error', reject);
        });
      });
    } catch (err: any) {
      console.error('Something went wrong:', err.stack);
      return Promise.reject(new Error(err.stack));
    }
  }
}
