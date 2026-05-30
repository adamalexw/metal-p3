import { BlurView } from 'expo-blur';
import { useNavigation } from 'expo-router';
import {
  Captions,
  ListMusic,
  type LucideIcon,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Skull,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Player, type RepeatMode } from '../../modules/metalp3-player';
import { PlayerProgressBar } from '../../src/components/PlayerProgressBar';
import QueueSheet from '../../src/components/QueueSheet';
import { useLyrics } from '../../src/lib/useLyrics';
import { useNowPlayingState } from '../../src/lib/useNowPlayingState';
import { tw } from '../../src/lib/tw';
import { useArtworkTheme } from '../../src/theme/useArtworkTheme';

const ICON_STROKE = 2.5;

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const state = useNowPlayingState();
  const [showLyrics, setShowLyrics] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  const current = state?.current;
  const isPlaying = state?.isPlaying ?? false;
  const repeatMode: RepeatMode = state?.repeatMode ?? 'off';
  const shuffle = state?.shuffle ?? false;
  const theme = useArtworkTheme(current?.uri ?? null);
  const lyrics = useLyrics(current?.uri ?? null);
  const hasLyrics = !!lyrics.text;

  const subtitle = useMemo(
    () => [current?.artist, current?.album].filter(Boolean).join(' — '),
    [current?.artist, current?.album],
  );

  const headerTitle = useMemo(() => {
    const artist = current?.artist ?? current?.albumArtist ?? '';
    const title = current?.title ?? '';
    if (artist && title) return `${artist} — ${title}`;
    if (title) return title;
    return 'Now Playing';
  }, [current?.artist, current?.albumArtist, current?.title]);

  useEffect(() => {
    navigation.setOptions({
      title: headerTitle,
      headerTransparent: true,
      headerStyle: { backgroundColor: 'transparent' },
      headerTintColor: theme.foreground,
      headerTitleStyle: { color: theme.foreground },
      headerRight: () => (
        <View style={tw`flex-row items-center gap-1 pr-1`}>
          <Pressable
            onPress={() => setQueueOpen(true)}
            style={tw`w-10 h-10 items-center justify-center`}
            hitSlop={8}
            testID="player-queue-toggle"
            accessibilityRole="button"
            accessibilityLabel="Show queue"
          >
            <ListMusic
              size={24}
              color={theme.foreground}
              strokeWidth={ICON_STROKE}
              strokeLinecap="square"
            />
          </Pressable>
          {hasLyrics ? (
            <Pressable
              onPress={() => setShowLyrics((v) => !v)}
              style={tw`w-10 h-10 items-center justify-center`}
              hitSlop={8}
              testID="player-lyrics-toggle"
              accessibilityRole="button"
              accessibilityLabel={showLyrics ? 'Hide lyrics' : 'Show lyrics'}
            >
              <Captions
                size={24}
                color={showLyrics ? theme.accent : theme.foreground}
                strokeWidth={ICON_STROKE}
                strokeLinecap="square"
              />
            </Pressable>
          ) : null}
        </View>
      ),
    });
  }, [navigation, headerTitle, theme.foreground, theme.accent, hasLyrics, showLyrics]);

  const artSize = useMemo(() => {
    const w = Dimensions.get('window').width - 48;
    return Math.max(160, Math.min(w, 480));
  }, []);

  const togglePlay = () => (isPlaying ? void MetalP3Player.pause() : void MetalP3Player.play());
  const cycleRepeat = () => {
    const next: RepeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    void MetalP3Player.setRepeatMode(next);
  };
  const toggleShuffle = () => void MetalP3Player.setShuffle(!shuffle);

  return (
    <View style={[tw`flex-1`, { backgroundColor: theme.background }]}>
      {theme.artworkDataUri ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="player-backdrop">
          <Image
            source={{ uri: theme.artworkDataUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={Platform.OS === 'android' ? 10 : 0}
          />
          {Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, tw`bg-black/30`]} />
          ) : (
            <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <View style={[StyleSheet.absoluteFill, tw`bg-black/30`]} />
        </View>
      ) : null}

      <View
        style={[tw`flex-1 px-6`, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      >
        {showLyrics && hasLyrics ? (
          <View style={tw`flex-1 items-stretch pt-2`} testID="player-lyrics">
            <Text
              style={[tw`text-[22px] font-extrabold text-center`, withShadow(theme.foreground)]}
              numberOfLines={2}
            >
              {current?.title ?? 'Nothing playing'}
            </Text>
            {subtitle ? (
              <Text
                style={[tw`mt-1.5 text-sm text-center`, withShadow(theme.mutedForeground)]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
            <ScrollView
              style={tw`flex-1 mt-4`}
              contentContainerStyle={tw`pb-6`}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={[
                  tw`text-lg font-semibold text-center`,
                  { lineHeight: 28 },
                  withShadow(theme.accent),
                ]}
              >
                {lyrics.text}
              </Text>
            </ScrollView>
          </View>
        ) : (
          <View style={tw`flex-1 items-center justify-end mt-2`}>
            <View
              style={[
                tw`max-w-full rounded-[18px] overflow-hidden mb-4`,
                {
                  width: artSize,
                  height: artSize,
                  shadowColor: '#000',
                  shadowOpacity: 0.5,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 12,
                },
              ]}
              testID="player-art"
            >
              {theme.artworkDataUri ? (
                <Image
                  source={{ uri: theme.artworkDataUri }}
                  style={tw`w-full h-full`}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    tw`w-full h-full items-center justify-center`,
                    { backgroundColor: theme.surface },
                  ]}
                >
                  <Skull
                    size={140}
                    color={theme.mutedForeground}
                    strokeWidth={ICON_STROKE}
                    strokeLinecap="square"
                  />
                </View>
              )}
            </View>
            <Text
              style={[tw`text-2xl font-extrabold text-center`, withShadow(theme.foreground)]}
              numberOfLines={2}
              testID="player-title"
            >
              {current?.title ?? 'Nothing playing'}
            </Text>
            {subtitle ? (
              <Text
                style={[tw`mt-1.5 text-sm text-center`, withShadow(theme.mutedForeground)]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        )}

        <View style={tw`items-center mt-4`}>
          <PlayerProgressBar
            positionMs={state?.positionMs ?? 0}
            durationMs={state?.durationMs ?? 0}
            accent={theme.accent}
            mutedForeground={theme.mutedForeground}
            onSeek={(ms) => {
              try {
                void MetalP3Player.seekTo(ms);
              } catch {
                // swallow — next stateChanged will reconcile
              }
            }}
            testID="player-progress"
          />

          <View style={tw`flex-row items-center gap-2 mt-2`}>
            <ToggleBtn
              active={shuffle}
              onPress={toggleShuffle}
              theme={theme}
              testID="player-shuffle"
              icon={Shuffle}
            />
            <IconBtn
              onPress={() => void MetalP3Player.skipToPrevious()}
              theme={theme}
              testID="player-prev"
              icon={SkipBack}
              filled
            />
            <PrimaryBtn
              onPress={togglePlay}
              theme={theme}
              testID="player-play"
              icon={isPlaying ? Pause : Play}
            />
            <IconBtn
              onPress={() => void MetalP3Player.skipToNext()}
              theme={theme}
              testID="player-next"
              icon={SkipForward}
              filled
            />
            <ToggleBtn
              active={repeatMode !== 'off'}
              onPress={cycleRepeat}
              theme={theme}
              testID="player-repeat"
              icon={repeatMode === 'one' ? Repeat1 : Repeat}
            />
          </View>

        </View>
      </View>

      <QueueSheet
        visible={queueOpen}
        onClose={() => setQueueOpen(false)}
        queue={state?.queue ?? []}
        currentIndex={state?.currentIndex ?? -1}
        theme={theme}
      />
    </View>
  );
}

interface BtnTheme {
  foreground: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  surface: string;
}

function PrimaryBtn({
  icon: Icon, onPress, theme, testID,
}: { icon: LucideIcon; onPress: () => void; theme: BtnTheme; testID?: string }) {
  return (
    <Pressable
      style={[
        tw`w-[88px] h-[88px] items-center justify-center rounded-full`,
        {
          backgroundColor: theme.accent,
          shadowColor: '#000',
          shadowOpacity: 0.45,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        },
      ]}
      onPress={onPress}
      testID={testID}
    >
      <Icon
        size={40}
        color={theme.accentForeground}
        fill={theme.accentForeground}
        strokeWidth={ICON_STROKE}
        strokeLinecap="square"
      />
    </Pressable>
  );
}

function IconBtn({
  icon: Icon, onPress, theme, testID, filled,
}: { icon: LucideIcon; onPress: () => void; theme: BtnTheme; testID?: string; filled?: boolean }) {
  return (
    <Pressable
      style={tw`w-14 h-14 items-center justify-center rounded-full`}
      onPress={onPress}
      testID={testID}
    >
      <Icon
        size={32}
        color={theme.foreground}
        fill={filled ? theme.foreground : 'transparent'}
        strokeWidth={ICON_STROKE}
        strokeLinecap="square"
      />
    </Pressable>
  );
}

function ToggleBtn({
  icon: Icon, active, onPress, theme, testID,
}: {
  icon: LucideIcon;
  active: boolean;
  onPress: () => void;
  theme: BtnTheme;
  testID?: string;
}) {
  const color = active ? theme.accent : theme.mutedForeground;
  return (
    <Pressable
      style={tw`w-14 h-14 items-center justify-center rounded-full`}
      onPress={onPress}
      testID={testID}
    >
      <Icon
        size={26}
        color={color}
        strokeWidth={ICON_STROKE}
        strokeLinecap="square"
      />
    </Pressable>
  );
}

function withShadow(color: string) {
  return {
    color,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  } as const;
}
