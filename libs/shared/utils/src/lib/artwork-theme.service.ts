import { Injectable } from '@angular/core';
import { FastAverageColor } from 'fast-average-color';
import { hslToRgb, lightenForContrast, rgbToHsl, toHex } from './color';

@Injectable({ providedIn: 'root' })
export class ArtworkThemeService {
  private readonly fac = new FastAverageColor();

  async applyThemeToElement(el: HTMLElement, url: string | undefined): Promise<string | undefined> {
    if (!url) {
      this.clearStyles(el);
      return undefined;
    }

    try {
      const color = await this.fac.getColorAsync(url, { algorithm: 'dominant' });
      let rgb = { r: color.value[0], g: color.value[1], b: color.value[2] };
      
      const hsl = rgbToHsl(rgb);
      
      // Boost vibrancy: ensure minimum saturation and lightness so colors don't look flat
      hsl.s = Math.max(hsl.s, 0.65); // Minimum 65% saturation
      hsl.l = Math.max(hsl.l, 0.4);  // Minimum 40% lightness
      
      rgb = hslToRgb(hsl);

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
    el.style.setProperty('--mdc-theme-primary', hex);
    el.style.setProperty('--mat-sys-primary', hex);
    el.style.setProperty('--sys-primary', hex);
    el.style.setProperty('--mat-icon-color', hex);
    
    el.style.setProperty('--mdc-slider-handle-color', hex);
    el.style.setProperty('--mdc-slider-focus-handle-color', hex);
    el.style.setProperty('--mdc-slider-hover-handle-color', hex);
    el.style.setProperty('--mdc-slider-active-track-color', hex);
  }

  private clearStyles(el: HTMLElement): void {
    el.style.removeProperty('--mdc-theme-primary');
    el.style.removeProperty('--mat-sys-primary');
    el.style.removeProperty('--sys-primary');
    el.style.removeProperty('--mat-icon-color');
    
    el.style.removeProperty('--mdc-slider-handle-color');
    el.style.removeProperty('--mdc-slider-focus-handle-color');
    el.style.removeProperty('--mdc-slider-hover-handle-color');
    el.style.removeProperty('--mdc-slider-active-track-color');
  }
}
