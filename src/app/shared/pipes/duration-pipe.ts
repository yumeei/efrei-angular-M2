import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    // Handle null, undefined, and 0
    // eslint-disable-next-line eqeqeq
    if (value == null || value === 0) {
      return '0s';
    }

    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = value % 60;

    let result = '';
    if (hours > 0) result += `${hours}h`;
    if (minutes > 0) result += `${result ? ' ' : ''}${minutes}m`;
    if (seconds > 0) result += `${result ? ' ' : ''}${seconds}s`;

    return result || '0s';
  }
}