import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'time' })
export class TimePipe implements PipeTransform {
  transform(time?: number): string | null {
    if (!time) {
      return '00:00';
    }

    const format = time > 3600 ? 'HH:mm:ss' : 'mm:ss';

    return new DatePipe('en-AU').transform(Math.ceil(time * 1000), format, 'UTC');
  }
}
