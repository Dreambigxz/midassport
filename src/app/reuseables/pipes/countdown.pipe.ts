import { Pipe, PipeTransform, ChangeDetectorRef } from '@angular/core';
import { interval, map, of, startWith, takeWhile } from 'rxjs';

@Pipe({
  name: 'countdown',
  standalone: true,
  pure: false
})
export class CountdownPipe implements PipeTransform {
  constructor(private cdr: ChangeDetectorRef) {}

  transform(targetDate: Date | string | number, add24hours: boolean = false) {
    if (!targetDate) return of(null);

    const start = new Date(targetDate).getTime();
    const settleAt = add24hours ? start + 24 * 60 * 60 * 1000 : start;

    return interval(1000).pipe(
      startWith(0),
      map(() => {
        const now = Date.now();
        const diff = settleAt - now;

        if (diff <= 0) return null;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');

        this.cdr.markForCheck(); // ✅ tell Angular it’s okay

        return `${hours}h ${formattedMinutes}m ${formattedSeconds}s`;
      }),
      takeWhile((val) => val !== null, true)
    );
  }
}
