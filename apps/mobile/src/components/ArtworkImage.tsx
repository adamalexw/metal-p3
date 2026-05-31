import { useEffect, useRef } from 'react';
import { Animated, type ImageStyle, type StyleProp } from 'react-native';

interface ArtworkImageProps {
  uri: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  blurRadius?: number;
  testID?: string;
}

/**
 * Crossfades into the new artwork as it becomes available so the player
 * doesn't snap from placeholder → image. Each unique uri animates in once
 * (cached uris start fully visible).
 */
export default function ArtworkImage({
  uri,
  style,
  resizeMode = 'cover',
  blurRadius,
  testID,
}: ArtworkImageProps) {
  const opacity = useRef(new Animated.Value(uri ? 1 : 0)).current;
  const lastUri = useRef<string | null>(uri);

  useEffect(() => {
    if (!uri) {
      opacity.setValue(0);
      lastUri.current = null;
      return;
    }
    if (uri === lastUri.current) return;
    lastUri.current = uri;
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [uri, opacity]);

  if (!uri) return null;

  return (
    <Animated.Image
      source={{ uri }}
      style={[style, { opacity }]}
      resizeMode={resizeMode}
      blurRadius={blurRadius}
      testID={testID}
    />
  );
}
