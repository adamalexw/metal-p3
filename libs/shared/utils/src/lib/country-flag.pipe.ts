import { Pipe, PipeTransform } from '@angular/core';
import * as countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);

@Pipe({
  name: 'countryFlag',
})
export class CountryFlagPipe implements PipeTransform {
  transform(country: string | null | undefined): string | null {
    if (!country) {
      return null;
    }
    const alpha2 = countries.getAlpha2Code(country, 'en');
    return alpha2 ? alpha2.toLowerCase() : null;
  }
}
