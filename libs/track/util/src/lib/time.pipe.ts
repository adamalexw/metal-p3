import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'time' })
export class TimePipe implements PipeTransform {
  transform(time?: number): string {
    if (!time) {
      return '00:00';
    }

    return new DatePipe('en-AU').transform(time * 1000, 'mm:ss', 'UTC');
  }
}
