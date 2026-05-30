import { usePathname, useRouter } from 'expo-router';
import { Disc3, Pause, Play, SkipBack, SkipForward } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Player } from '../../modules/metalp3-player';
import { useNowPlayingState } from '../lib/useNowPlayingState';
import { useArtworkTheme } from '../theme/useArtworkTheme';

export const MINI_PLAYER_HEIGHT = 72;

const ICON_STROKE = 2.5;

export default function MiniPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const state = useNowPlayingState();
  const current = state?.current ?? null;
  const theme = useArtworkTheme(current?.uri ?? null);

  if (!current) return null;
  if (pathname?.endsWith('/player')) return null;

  const isPlaying = state?.isPlaying ?? false;
  const artistLine = current.artist ?? current.albumArtist ?? '';

  const openPlayer = () => router.push('/(tabs)/player' as never);
  const togglePlay = () => (isPlaying ? void MetalP3Player.pause() : void MetalP3Player.play());
  const skipPrev = () => void MetalP3Player.skipToPrevious();
  const skipNext = () => void MetalP3Player.skipToNext();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { bottom: insets.bottom + 8 }]}
      testID="mini-player-host"
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: withAlpha(theme.surface, 0.92),
            borderColor: withAlpha(theme.foreground, 0.08),
          },
        ]}
        testID="mini-player"
      >
        <Pressable
          style={styles.body}
          onPress={openPlayer}
          testID="mini-player-body"
          accessibilityRole="button"
          accessibilityLabel="Open now playing"
        >
          <View style={[styles.art, { backgroundColor: theme.surface }]}>
            {theme.artworkDataUri ? (
              <Image
                source={{ uri: theme.artworkDataUri }}
                style={styles.artImage}
                resizeMode="cover"
              />
            ) : (
              <Disc3
                size={32}
                color={theme.mutedForeground}
                strokeWidth={ICON_STROKE}
                strokeLinecap="square"
              />
            )}
          </View>
          <View style={styles.textWrap}>
            <Text
              style={[styles.title, { color: theme.foreground }]}
              numberOfLines={1}
              testID="mini-player-title"
            >
              {current.title ?? 'Unknown title'}
            </Text>
            {artistLine ? (
              <Text
                style={[styles.artist, { color: theme.mutedForeground }]}
                numberOfLines={1}
                testID="mini-player-artist"
              >
                {artistLine}
              </Text>
            ) : null}
          </View>
        </Pressable>

        <View style={styles.controls}>
          <Pressable
            style={styles.iconBtn}
            onPress={skipPrev}
            testID="mini-player-prev"
            accessibilityRole="button"
            accessibilityLabel="Skip to previous track"
            hitSlop={8}
          >
            <SkipBack
              size={22}
              color={theme.foreground}
              fill={theme.foreground}
              strokeWidth={ICON_STROKE}
              strokeLinecap="square"
            />
          </Pressable>
          <Pressable
            style={[styles.playBtn, { backgroundColor: theme.accent }]}
            onPress={togglePlay}
            testID="mini-player-play"
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            hitSlop={6}
          >
            {isPlaying ? (
              <Pause
                size={22}
                color={theme.accentForeground}
                fill={theme.accentForeground}
                strokeWidth={ICON_STROKE}
                strokeLinecap="square"
              />
            ) : (
              <Play
                size={22}
                color={theme.accentForeground}
                fill={theme.accentForeground}
                strokeWidth={ICON_STROKE}
                strokeLinecap="square"
              />
            )}
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={skipNext}
            testID="mini-player-next"
            accessibilityRole="button"
            accessibilityLabel="Skip to next track"
            hitSlop={8}
          >
            <SkipForward
              size={22}
              color={theme.foreground}
              fill={theme.foreground}
              strokeWidth={ICON_STROKE}
              strokeLinecap="square"
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const a = Math.max(0, Math.min(1, alpha));
  const aHex = Math.round(a * 255).toString(16).padStart(2, '0');
  return `#${m[1]}${aHex}`;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: MINI_PLAYER_HEIGHT,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 8,
    minHeight: MINI_PLAYER_HEIGHT,
  },
  art: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artImage: { width: '100%', height: '100%' },
  textWrap: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700' },
  artist: { fontSize: 12, marginTop: 2 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  playBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
});
