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
  if (!image) return '/assets/blank.png';
  try {
    const bytes = Uint8Array.from(atob(image), (c) => c.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
  } catch (error) {
    console.error('Error creating object URL from image', error);
    return '/assets/blank.png';
  }
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

export const objectKeys = <Obj extends object>(obj: Obj): (keyof Obj)[] => {
  return Object.keys(obj) as (keyof Obj)[];
};
