import { usePathname, useRouter } from 'expo-router';
import { Disc3, Pause, Play, SkipBack, SkipForward } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Player } from '../../modules/metalp3-player';
import { withAlpha } from '../lib/color';
import { useNowPlayingState } from '../lib/useNowPlayingState';
import { tw } from '../lib/tw';
import { ICON_STROKE } from '../theme/icons';
import { useArtworkTheme } from '../theme/useArtworkTheme';
import ArtworkImage from './ArtworkImage';

export const MINI_PLAYER_HEIGHT = 72;

export default function MiniPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const state = useNowPlayingState();
  const current = state?.current ?? null;
  const isPlaying = state?.isPlaying ?? false;
  const queue = state?.queue ?? [];
  const theme = useArtworkTheme(current?.uri ?? null);

  if (queue.length === 0) return null;
  if (!current) return null;
  if (pathname?.endsWith('/player')) return null;
  const artistLine = current.artist ?? current.albumArtist ?? '';

  const openPlayer = () => router.push('/(tabs)/player' as never);
  const togglePlay = () => (isPlaying ? void MetalP3Player.pause() : void MetalP3Player.play());
  const skipPrev = () => void MetalP3Player.skipToPrevious();
  const skipNext = () => void MetalP3Player.skipToNext();

  return (
    <View
      pointerEvents="box-none"
      style={[tw`absolute left-3 right-3 h-[${MINI_PLAYER_HEIGHT}px]`, { bottom: insets.bottom + 8 }]}
      testID="mini-player-host"
    >
      <View
        style={[
          tw`flex-1 flex-row items-center rounded-[14px] overflow-hidden`,
          {
            borderWidth: StyleSheet.hairlineWidth,
            backgroundColor: withAlpha(theme.surface, 0.92),
            borderColor: withAlpha(theme.foreground, 0.08),
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          },
        ]}
        testID="mini-player"
      >
        <Pressable
          style={tw`flex-1 flex-row items-center px-2 py-2 min-h-[${MINI_PLAYER_HEIGHT}px]`}
          onPress={openPlayer}
          testID="mini-player-body"
          accessibilityRole="button"
          accessibilityLabel="Open now playing"
        >
          <View
            style={[
              tw`w-14 h-14 rounded-lg overflow-hidden items-center justify-center`,
              { backgroundColor: theme.surface },
            ]}
          >
            <Disc3
              size={32}
              color={theme.mutedForeground}
              strokeWidth={ICON_STROKE}
              strokeLinecap="square"
            />
            <ArtworkImage
              uri={theme.artworkDataUri}
              style={tw`absolute inset-0 w-full h-full`}
              resizeMode="cover"
            />
          </View>
          <View style={tw`flex-1 px-3 justify-center`}>
            <Text
              style={[tw`text-sm font-bold`, { color: theme.foreground }]}
              numberOfLines={1}
              testID="mini-player-title"
            >
              {current.title ?? 'Unknown title'}
            </Text>
            {artistLine ? (
              <Text
                style={[tw`text-xs mt-0.5`, { color: theme.mutedForeground }]}
                numberOfLines={1}
                testID="mini-player-artist"
              >
                {artistLine}
              </Text>
            ) : null}
          </View>
        </Pressable>

        <View style={tw`flex-row items-center px-2 gap-1`}>
          <Pressable
            style={tw`w-11 h-11 items-center justify-center rounded-full`}
            onPress={skipPrev}
            testID="mini-player-prev"
            accessibilityRole="button"
            accessibilityLabel="Skip to previous track"
            hitSlop={8}
          >
            <SkipBack
              size={22}
              color={theme.accent}
              fill={theme.accent}
              strokeWidth={ICON_STROKE}
              strokeLinecap="square"
            />
          </Pressable>
          <Pressable
            style={[tw`w-12 h-12 items-center justify-center rounded-full`, { backgroundColor: theme.accent }]}
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
            style={tw`w-11 h-11 items-center justify-center rounded-full`}
            onPress={skipNext}
            testID="mini-player-next"
            accessibilityRole="button"
            accessibilityLabel="Skip to next track"
            hitSlop={8}
          >
            <SkipForward
              size={22}
              color={theme.accent}
              fill={theme.accent}
              strokeWidth={ICON_STROKE}
              strokeLinecap="square"
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
