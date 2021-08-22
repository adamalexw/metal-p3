export const tail = <T>(a: Array<T>): T => a[a.length - 1];

export const chunkReducerForSize =
  (chunkSize = 5) =>
  <T>(result: T[][], item: T) => {
    const lastElm = tail(result);
    if (lastElm.length === chunkSize) {
      result.push([item]);
    } else {
      lastElm.push(item);
    }
    return result;
  };

export const toChunks = <T>(arr: T[], chunkSize = 5): Array<T[]> => {
  return arr.reduce(chunkReducerForSize(chunkSize), [[]] as T[][]);
};
