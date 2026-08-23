import { Image, type ImageStyle } from 'expo-image';
import { useRef, useState } from 'react';
import type { StyleProp } from 'react-native';

interface RetryingArtworkProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
}

/**
 * A transient decode failure (common when scrolling fast) shouldn't blank the
 * artwork permanently. Bumping `retry` remounts just this <Image> to
 * re-attempt the same uri, bounded to 2 tries. Resets when the consumer
 * recycles to a new uri.
 */
export default function RetryingArtwork({ uri, style }: RetryingArtworkProps) {
  const [retry, setRetry] = useState(0);
  const lastUri = useRef(uri);
  if (lastUri.current !== uri) {
    lastUri.current = uri;
    if (retry !== 0) setRetry(0);
  }

  return (
    <Image
      key={`${uri}:${retry}`}
      source={{ uri }}
      style={style}
      contentFit="cover"
      cachePolicy="memory-disk"
      recyclingKey={uri}
      transition={120}
      onError={() => setRetry((r) => (r < 2 ? r + 1 : r))}
    />
  );
}
