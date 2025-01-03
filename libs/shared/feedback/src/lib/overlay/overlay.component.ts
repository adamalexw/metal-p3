/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { NgComponentOutlet } from '@angular/common';
import { Component, OnInit, TemplateRef, Type, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AppOverlayRef } from './overlay-ref';

@Component({
  imports: [NgComponentOutlet, OverlayModule, PortalModule, MatCardModule, MatButtonModule],
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
})
export class OverlayComponent implements OnInit {
  private readonly ref = inject(AppOverlayRef);

  contentType: 'template' | 'string' | 'component' = 'string';
  content: string | TemplateRef<unknown> | Type<unknown> = '';
  context: Object | null = null;

  close() {
    this.ref.close(null);
  }

  ngOnInit() {
    this.content = this.ref.content;

    if (typeof this.content === 'string') {
      this.contentType = 'string';
    } else if (this.content instanceof TemplateRef) {
      this.contentType = 'template';
      this.context = {
        close: this.ref.close.bind(this.ref),
      };
    } else {
      this.contentType = 'component';
    }
  }

  get contentAsTemplate(): TemplateRef<unknown> {
    return this.content as TemplateRef<unknown>;
  }

  get contentAsComponent(): Type<any> {
    return this.content as Type<any>;
  }
}
