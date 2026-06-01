export function shuffled<T>(items: readonly T[]): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function reshuffleAfter<T>(items: readonly T[], currentIndex: number): T[] {
  if (items.length <= 1 || currentIndex < 0 || currentIndex >= items.length) {
    return shuffled(items);
  }
  const before = items.slice(0, currentIndex);
  const after = items.slice(currentIndex + 1);
  return [items[currentIndex], ...shuffled([...before, ...after])];
}
