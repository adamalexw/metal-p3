import * as Adb from '@devicefarmer/adbkit';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { Injectable } from '@nestjs/common';
import * as Bluebird from 'bluebird';

@Injectable()
export class AdbService {
  private client: Adb.Client;

  constructor(private readonly fileSystemService: FileSystemService) {
    this.client = new Adb.Client({ bin: 'C://platform-tools//adb.exe', port: 5037 });
  }

  async getDevices() {
    const devices = await this.client.listDevices();

    if (!devices.length) {
      return Error('no devices connected');
    }

    return devices;
  }

  async transferFile(file: string) {
    try {
      const dest = `/storage/emulated/0/Music/${this.fileSystemService.getParentFoler(file)}/${this.fileSystemService.getFilename(file)}`;
      const devices = await this.client.listDevices();

      await Bluebird.map(devices, async (device: Adb.Device) => {
        const deviceClient = this.client.getDevice(device.id);
        const transfer = await deviceClient.push(file, dest);
        await new Bluebird(function (resolve, reject) {
          transfer.on('progress', (stats) => console.log(`[${device.id}] Pushed ${stats.bytesTransferred} bytes so far`));
          transfer.on('end', () => {
            console.log('[${device.id}] Push complete');

            const command = `am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d "file://${dest}"`;
            deviceClient
              .shell(command)
              .then(Adb.Adb.util.readAll)
              .then(function (output) {
                console.log('[%s] %s', device.id, output.toString().trim());
              });

            resolve();
          });
          transfer.on('error', reject);
        });
      });
    } catch (err) {
      console.error('Something went wrong:', err.stack);
    }
  }
}
