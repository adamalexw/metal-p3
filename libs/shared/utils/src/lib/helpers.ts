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

// export const mapBlobToBase64 = (blob: Blob): Observable<string> => {
//   const reader = new FileReader();
//   reader.readAsDataURL(blob);

//   let base64String = '';
//   reader.onloadend = () => {
//     base64String = reader.result as string;

//     // Simply Print the Base64 Encoded String,
//     // without additional data: Attributes.
//     if (base64String) {
//       return base64String.substr(base64String.indexOf(', ') + 1);
//     }

//     return '';
//   };

//   console.log('end', base64String);
//   return '';
// };

export const mapBlobToBase64 = (blob: Blob) => {
  return from(
    new Promise((resolve, reject) => {
      //create a new Promise
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = () => resolve(reader.result as string); //resolve when it finishes to load the file
      reader.onerror = () => reject(reader.error); //rejects if there was an error while reading the file
    })
  );
};
