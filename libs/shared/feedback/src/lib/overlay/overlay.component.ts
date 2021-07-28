/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, TemplateRef, Type } from '@angular/core';
import { AppOverlayRef } from './overlay-ref';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
})
export class OverlayComponent implements OnInit {
  contentType: 'template' | 'string' | 'component' = 'string';
  content: string | TemplateRef<unknown> | Type<unknown> = '';
  context: Object | null = null;

  constructor(private ref: AppOverlayRef) {}

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
