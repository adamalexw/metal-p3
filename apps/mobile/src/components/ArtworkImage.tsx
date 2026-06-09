import { Image, type ImageContentFit, type ImageStyle } from 'expo-image';
import { type StyleProp } from 'react-native';
import { evictArtworkTheme } from '../theme/useArtworkTheme';
import { resetArtworkRetry } from '../lib/useTrackArtwork';

interface ArtworkImageProps {
  uri: string | null;
  trackUri?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  blurRadius?: number;
  testID?: string;
}

const TRANSITION_MS = 220;

const RESIZE_TO_FIT: Record<NonNullable<ArtworkImageProps['resizeMode']>, ImageContentFit> = {
  cover: 'cover',
  contain: 'contain',
  stretch: 'fill',
  center: 'scale-down',
};

/**
 * Crossfades into the new artwork via expo-image's built-in transition,
 * sharing its memory+disk cache with every other artwork instance in the app.
 * Each unique uri animates in once; cached uris start fully visible.
 */
export default function ArtworkImage({
  uri,
  trackUri,
  style,
  resizeMode = 'cover',
  blurRadius,
  testID,
}: ArtworkImageProps) {
  if (!uri) return null;

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={RESIZE_TO_FIT[resizeMode]}
      transition={TRANSITION_MS}
      blurRadius={blurRadius}
      cachePolicy="memory-disk"
      testID={testID}
      onLoad={() => {
        if (trackUri) {
          resetArtworkRetry(trackUri);
        }
      }}
      onError={() => {
        if (trackUri) {
          evictArtworkTheme(trackUri);
        }
      }}
    />
  );
}
