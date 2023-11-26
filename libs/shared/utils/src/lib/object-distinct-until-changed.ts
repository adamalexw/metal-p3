import { deepEqual } from 'fast-equals';
import { distinctUntilChanged, Observable, OperatorFunction } from 'rxjs';

/**
 * distinctUntilChanged using a deep compare
 */
export function objectDistinctUntilChanged<T>(): OperatorFunction<T, T> {
  return (source: Observable<T>): Observable<T> => source.pipe(distinctUntilChanged((a, b) => deepEqual(a, b)));
}
