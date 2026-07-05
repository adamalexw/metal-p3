import { BlurView } from 'expo-blur';
import { useNavigation } from 'expo-router';
import { Menu } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { tw } from '../lib/tw';

const HEADER_MAX = 132;
const HEADER_MIN = 64;
const COLLAPSE_RANGE = HEADER_MAX - HEADER_MIN;
export const LIBRARY_HEADER_MAX_HEIGHT = HEADER_MAX;
export const LIBRARY_HEADER_MIN_HEIGHT = HEADER_MIN;

interface Props {
  title: string;
  stats: string | null;
  topInset: number;
  scrollY: SharedValue<number>;
}

export default function LibraryHeader({ title, stats, topInset, scrollY }: Props) {
  const navigation = useNavigation();

  // Inner content row slides up as the user scrolls — visual equivalent of the
  // old animated-height collapse, but transform-only so we don't relayout each
  // frame. Container stays at its full HEADER_MAX height; touches pass through
  // the now-transparent lower band via pointerEvents="box-none".
  const innerStyle = useAnimatedStyle(() => {
    const collapse = interpolate(scrollY.value, [0, COLLAPSE_RANGE], [0, 1], Extrapolation.CLAMP);
    return { transform: [{ translateY: -collapse * (COLLAPSE_RANGE / 2) }] };
  });

  const logoStyle = useAnimatedStyle(() => {
    const t = interpolate(scrollY.value, [0, COLLAPSE_RANGE], [1, 0.55], Extrapolation.CLAMP);
    return { transform: [{ scale: t }] };
  });

  const surfaceStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, COLLAPSE_RANGE], [0, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  return (
    <View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          height: HEADER_MAX + topInset,
        },
      ]}
      pointerEvents="box-none"
      testID="library-header"
    >
      {/* Surface fills only the collapsed-header band so list content below it
          stays visible behind the transparent lower portion. */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_MIN + topInset },
          surfaceStyle,
        ]}
        pointerEvents="none"
      >
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, tw`bg-black/55`]} />
      </Animated.View>

      <Animated.View
        style={[
          tw`flex-row items-center px-2`,
          {
            position: 'absolute',
            top: topInset,
            left: 0,
            right: 0,
            height: HEADER_MAX,
          },
          innerStyle,
        ]}
      >
        <Pressable
          onPress={() => navigation.dispatch({ type: 'OPEN_DRAWER' } as any)}
          style={tw`w-10 h-10 items-center justify-center mr-2`}
          hitSlop={8}
          testID="library-menu-toggle"
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Menu size={24} color="#ffffff" strokeWidth={2.25} strokeLinecap="square" />
        </Pressable>
        <View style={tw`flex-1`}>
          <Text style={tw`text-white text-2xl font-extrabold`} numberOfLines={1}>
            {title}
          </Text>
          {stats ? (
            <Text style={tw`text-[#bbb] text-xs mt-0.5`} numberOfLines={1}>
              {stats}
            </Text>
          ) : null}
        </View>
        <Animated.View style={[tw`ml-3`, logoStyle]}>
          <Image
            source={require('../../assets/images/splash-icon.png')}
            style={tw`w-20 h-20`}
            contentFit="contain"
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/**
 * In-flow spacer matching the header's expanded height. Place it in a list's
 * `ListHeaderComponent` so the first row of content doesn't sit under the
 * sticky header at scrollY = 0.
 */
export function LibraryHeaderSpacer({ topInset }: { topInset: number }) {
  return <View style={{ height: HEADER_MAX + topInset }} pointerEvents="none" />;
}

export function formatLibraryStats(albums: { trackCount: number; totalDurationMs: number }[]): string | null {
  const albumCount = albums.length;
  if (albumCount === 0) return null;
  const trackCount = albums.reduce((sum, a) => sum + a.trackCount, 0);
  const totalMs = albums.reduce((sum, a) => sum + a.totalDurationMs, 0);
  const hours = Math.floor(totalMs / 3_600_000);
  const duration = hours >= 1
    ? `${hours} ${hours === 1 ? 'hour' : 'hours'}`
    : `${Math.floor(totalMs / 60_000)} min`;
  return `${albumCount} ${albumCount === 1 ? 'album' : 'albums'} · ${trackCount} ${trackCount === 1 ? 'track' : 'tracks'} · ${duration}`;
}
