import { BlurView } from 'expo-blur';
import {
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
import { useMemo, useState } from 'react';
import { Dimensions, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Player, type RepeatMode } from '../../modules/metalp3-player';
import { PlayerProgressBar } from '../../src/components/PlayerProgressBar';
import { useLyrics } from '../../src/lib/useLyrics';
import { useNowPlayingState } from '../../src/lib/useNowPlayingState';
import { useArtworkTheme } from '../../src/theme/useArtworkTheme';

const ICON_STROKE = 2.5;

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const state = useNowPlayingState();
  const [showLyrics, setShowLyrics] = useState(false);

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {theme.artworkDataUri ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="player-backdrop">
          <Image
            source={{ uri: theme.artworkDataUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={Platform.OS === 'android' ? 10 : 0}
          />
          {Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, styles.webBackdropOverlay]} />
          ) : (
            <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <View style={[StyleSheet.absoluteFill, styles.darken]} />
        </View>
      ) : null}

      <View style={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        {showLyrics && hasLyrics ? (
          <View style={styles.lyricsWrap} testID="player-lyrics">
            <Text style={[styles.title, styles.titleLyrics, withShadow(theme.foreground)]} numberOfLines={2}>
              {current?.title ?? 'Nothing playing'}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, withShadow(theme.mutedForeground)]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            <ScrollView
              style={styles.lyricsScroll}
              contentContainerStyle={styles.lyricsContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.lyricsText, withShadow(theme.accent)]}>{lyrics.text}</Text>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.artWrap}>
            <View style={[styles.art, { width: artSize, height: artSize }]} testID="player-art">
              {theme.artworkDataUri ? (
                <Image source={{ uri: theme.artworkDataUri }} style={styles.artImage} resizeMode="cover" />
              ) : (
                <View style={[styles.artPlaceholder, { backgroundColor: theme.surface }]}>
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
              style={[styles.title, withShadow(theme.foreground)]}
              numberOfLines={2}
              testID="player-title"
            >
              {current?.title ?? 'Nothing playing'}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, withShadow(theme.mutedForeground)]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        )}

        <View style={styles.transportArea}>
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

          <View style={styles.transport}>
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

          {hasLyrics ? (
            <Pressable
              style={[
                styles.lyricsToggle,
                {
                  backgroundColor: showLyrics ? theme.accent : 'transparent',
                  borderColor: theme.accent,
                },
              ]}
              onPress={() => setShowLyrics((v) => !v)}
              testID="player-lyrics-toggle"
            >
              <Text
                style={[
                  styles.lyricsToggleLabel,
                  withShadow(showLyrics ? theme.accentForeground : theme.accent),
                ]}
              >
                {showLyrics ? 'Hide lyrics' : 'Lyrics'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
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
      style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.accent }]}
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
    <Pressable style={styles.btn} onPress={onPress} testID={testID}>
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
    <Pressable style={styles.btn} onPress={onPress} testID={testID}>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  darken: { backgroundColor: 'rgba(0,0,0,0.3)' },
  webBackdropOverlay: { backgroundColor: 'rgba(0,0,0,0.3)' },

  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },

  artWrap: { alignItems: 'center', marginTop: 8 },
  art: {
    maxWidth: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  artImage: { width: '100%', height: '100%' },
  artPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  titleLyrics: { fontSize: 22 },
  subtitle: { marginTop: 6, fontSize: 14, textAlign: 'center' },

  lyricsWrap: { flex: 1, alignItems: 'stretch', paddingTop: 8 },
  lyricsScroll: { flex: 1, marginTop: 16 },
  lyricsContent: { paddingBottom: 24 },
  lyricsText: { fontSize: 18, lineHeight: 28, fontWeight: '600', textAlign: 'center' },

  transportArea: { alignItems: 'center', marginTop: 16 },

  transport: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  btn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 28 },
  btnPrimary: {
    width: 88,
    height: 88,
    borderRadius: 44,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  lyricsToggle: {
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  lyricsToggleLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
});
