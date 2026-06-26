import { Injectable } from '@angular/core';
import { FastAverageColor } from 'fast-average-color';
import { lightenForContrast, toHex } from './color';

@Injectable({ providedIn: 'root' })
export class ArtworkThemeService {
  private readonly fac = new FastAverageColor();

  async applyThemeToElement(el: HTMLElement, url: string | undefined): Promise<string | undefined> {
    if (!url) {
      this.clearStyles(el);
      return undefined;
    }

    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const height = Math.floor(img.naturalHeight * 0.3);
      const color = await this.fac.getColorAsync(img, { 
        algorithm: 'dominant',
        top: 0,
        left: 0,
        width: img.naturalWidth,
        height: height > 0 ? height : 50
      });
      let rgb = { r: color.value[0], g: color.value[1], b: color.value[2] };

      const background = { r: 16, g: 16, b: 16 };
      const primaryRgb = lightenForContrast(rgb, background, 4.5);
      const primaryHex = toHex(primaryRgb);

      this.applyStyles(el, primaryHex);
      return primaryHex;
    } catch (e) {
      console.error('Failed to extract color', e);
      this.clearStyles(el);
      return undefined;
    }
  }

  clearTheme(el: HTMLElement): void {
    this.clearStyles(el);
  }

  private applyStyles(el: HTMLElement, hex: string): void {
    el.style.setProperty('--mdc-theme-primary', hex, 'important');
    el.style.setProperty('--mat-sys-primary', hex, 'important');
    el.style.setProperty('--sys-primary', hex, 'important');
    el.style.setProperty('--mat-icon-color', hex, 'important');
    
    el.style.setProperty('--mat-sys-on-surface', hex, 'important');
    el.style.setProperty('--mat-sys-on-surface-variant', hex, 'important');
    el.style.setProperty('color', hex, 'important');

    el.style.setProperty('--mdc-slider-handle-color', hex, 'important');
    el.style.setProperty('--mdc-slider-focus-handle-color', hex, 'important');
    el.style.setProperty('--mdc-slider-hover-handle-color', hex, 'important');
    el.style.setProperty('--mdc-slider-active-track-color', hex, 'important');
  }

  private clearStyles(el: HTMLElement): void {
    el.style.removeProperty('--mdc-theme-primary');
    el.style.removeProperty('--mat-sys-primary');
    el.style.removeProperty('--sys-primary');
    el.style.removeProperty('--mat-icon-color');
    
    el.style.removeProperty('--mat-sys-on-surface');
    el.style.removeProperty('--mat-sys-on-surface-variant');
    el.style.removeProperty('color');

    el.style.removeProperty('--mdc-slider-handle-color');
    el.style.removeProperty('--mdc-slider-focus-handle-color');
    el.style.removeProperty('--mdc-slider-hover-handle-color');
    el.style.removeProperty('--mdc-slider-active-track-color');
  }
}
