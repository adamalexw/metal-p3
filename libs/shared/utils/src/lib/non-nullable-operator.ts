import { Observable, OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';

export function nonNullable<T>(): OperatorFunction<T, NonNullable<T>> {
  return (source: Observable<T>): Observable<NonNullable<T>> => source.pipe(filter((value: T): value is NonNullable<T> => value !== undefined && value !== null));
}
