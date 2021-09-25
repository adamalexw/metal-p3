import { OverlayRef } from '@angular/cdk/overlay';
import { TemplateRef, Type } from '@angular/core';
import { Subject } from 'rxjs';

export interface OverlayCloseEvent<R> {
  type: 'backdropClick' | 'close';
  data: R;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AppOverlayRef<R = any, T = any> {
  afterClosed$ = new Subject<OverlayCloseEvent<R | undefined>>();

  constructor(public overlay: OverlayRef, public content: string | TemplateRef<unknown> | Type<unknown>, public data: T) {
    overlay.backdropClick().subscribe(() => {
      this._close('backdropClick', undefined);
    });
  }

  close(data?: R) {
    this._close('close', data);
  }

  private _close(type: 'backdropClick' | 'close', data: R | undefined) {
    this.overlay.dispose();
    this.afterClosed$.next({
      type,
      data,
    });

    this.afterClosed$.complete();
  }
}
