import { CommonModule, DatePipe } from '@angular/common';
import { NgModule, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'time' })
export class TimePipe implements PipeTransform {
  transform(time: number | null | undefined): string | null {
    if (!time) {
      return '00:00';
    }

    const format = time > 3600 ? 'HH:mm:ss' : 'mm:ss';

    return new DatePipe('en-AU').transform(Math.ceil(time * 1000), format, 'UTC');
  }
}

@NgModule({
  imports: [CommonModule],
  declarations: [TimePipe],
  exports: [TimePipe],
})
export class TimePipeModule {}
