import { HttpParams } from '@angular/common/http';
import { from } from 'rxjs';

export function extractUrl(url: string): string | undefined {
  const regex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[A-Z0-9+&@#/%=~_|$])/gim;
  const matches = url.match(regex);

  if (matches?.length) {
    return matches[0];
  }

  return;
}

export const createToObjectUrl = (image: string): string => {
  if (image) {
    const byteString = atob(image);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: 'image/png' });

    const link = URL.createObjectURL(blob);
    return link;
  }

  return '/assets/blank.png';
};

export const mapBlobToBase64 = (blob: Blob) => {
  return from(
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
    }),
  );
};

export const removeNullValuesFromQueryParams = (params: HttpParams) => {
  const paramsKeysAux = params.keys();
  paramsKeysAux.forEach((key) => {
    const value = params.get(key);
    if (value === null || value === undefined || value === '') {
      params['map'].delete(key);
    }
  });

  return params;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export const objectKeys = <Obj extends {}>(obj: Obj): (keyof Obj)[] => {
  return Object.keys(obj) as (keyof Obj)[];
};
