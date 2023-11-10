import { ConnectionPositionPair, Overlay, OverlayConfig, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, Injector, TemplateRef, Type } from '@angular/core';
import { AppOverlayRef } from './overlay-ref';
import { OverlayComponent } from './overlay.component';

@Injectable()
export class OverlayService {
  constructor(private readonly overlay: Overlay) {}

  open<R = unknown, T = unknown>(origin: HTMLElement, content: string | TemplateRef<unknown> | Type<unknown>, data: T): AppOverlayRef<R> {
    const config = new OverlayConfig({
      hasBackdrop: true,
      positionStrategy: this.getOverlayPosition(origin),
    });

    const overlayRef = this.overlay.create(config);

    const myOverlayRef = new AppOverlayRef<R, T>(overlayRef, content, data);

    overlayRef.attach(new ComponentPortal(OverlayComponent, null, Injector.create({ providers: [{ provide: AppOverlayRef, useValue: myOverlayRef }] })));

    return myOverlayRef;
  }

  private getOverlayPosition(origin: HTMLElement): PositionStrategy {
    const positionStrategy = this.overlay.position().flexibleConnectedTo(origin).withPositions(this.getPositions()).withPush(true);

    return positionStrategy;
  }

  private getPositions(): ConnectionPositionPair[] {
    return [
      {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
      },
      {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top',
      },
    ];
  }
}
