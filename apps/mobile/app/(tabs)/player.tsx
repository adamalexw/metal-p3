import { BlurView } from 'expo-blur';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import {
  Captions,
  ListMusic,
  type LucideIcon,
  Menu,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Skull,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Player, type RepeatMode } from '../../modules/metalp3-player';
import ArtworkImage from '../../src/components/ArtworkImage';
import { PlayerProgressBar } from '../../src/components/PlayerProgressBar';
import QueueSheet from '../../src/components/QueueSheet';
import { withAlpha } from '../../src/lib/color';
import { toFlagEmoji } from '../../src/lib/country-flag';
import { findAlbumGroup, getLibraryTracks, subscribe as subscribeLibrary } from '../../src/lib/library-cache';
import { shuffled } from '../../src/lib/shuffle';
import { useLyrics } from '../../src/lib/useLyrics';
import { useNowPlayingState } from '../../src/lib/useNowPlayingState';
import { useSyncedLyrics } from '../../src/lib/useSyncedLyrics';
import { SyncedLyricsView } from '../../src/lib/SyncedLyricsView';
import { useTrackExtras } from '../../src/lib/useTrackExtras';
import { tw } from '../../src/lib/tw';
import { ICON_STROKE } from '../../src/theme/icons';
import { useArtworkTheme } from '../../src/theme/useArtworkTheme';

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const state = useNowPlayingState();
  const [showLyrics, setShowLyrics] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [libraryTick, setLibraryTick] = useState(0);

  useEffect(() => subscribeLibrary(() => setLibraryTick((n) => n + 1)), []);

  const current = state?.current;
  const isPlaying = state?.isPlaying ?? false;
  const repeatMode: RepeatMode = state?.repeatMode ?? 'off';
  const shuffle = state?.shuffle ?? false;
  const queueLength = state?.queue?.length ?? 0;
  const currentIndex = state?.currentIndex ?? -1;
  const canSkipNext =
    queueLength > 0 && (repeatMode !== 'off' || currentIndex < queueLength - 1);
  const canSkipPrev = queueLength > 0 && (repeatMode !== 'off' || currentIndex > 0);
  const theme = useArtworkTheme(current?.uri ?? null);
  const lyrics = useLyrics(current?.uri ?? null);
  const synced = useSyncedLyrics(current?.uri ?? null);
  const hasSynced = !!synced.lines?.length;
  const hasLyrics = hasSynced || !!lyrics.text;
  const extras = useTrackExtras(current?.uri ?? null);
  const flag = useMemo(() => toFlagEmoji(extras.country), [extras.country]);
  const albumUrl = extras.metalArchivesUrl;

  const artistText = current?.artist ?? '';
  const albumText = current?.album ?? '';
  const subtitleSeparator = artistText && albumText ? ' — ' : '';

  const albumKey = useMemo(() => {
    const band = (current?.albumArtist ?? current?.artist ?? '').toLowerCase().trim();
    const album = (current?.album ?? '').toLowerCase().trim();
    if (!band || !album) return null;
    return `${band}|${album}`;
  }, [current?.albumArtist, current?.artist, current?.album]);

  const genre = useMemo(() => {
    if (albumKey) {
      const group = findAlbumGroup(albumKey);
      if (group?.genre) return group.genre;
    }
    const id = current?.id;
    const uri = current?.uri;
    const tracks = getLibraryTracks();
    const track =
      (id ? tracks.find((t) => t.id === id) : null) ??
      (uri ? tracks.find((t) => t.uri === uri) : null);
    return track?.genre ?? null;
    // libraryTick: re-runs when the external library cache populates/changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumKey, current?.id, current?.uri, libraryTick]);

  const headerSubtitle = useMemo(() => {
    const band = current?.artist ?? current?.albumArtist ?? '';
    const album = current?.album ?? '';
    return [band, album].filter(Boolean).join(' — ');
  }, [current?.artist, current?.albumArtist, current?.album]);

  const headerTitleText = current?.title ?? 'Now Playing';

  const openAlbum = useCallback(() => {
    if (!albumKey) return;
    router.push(`/album/${encodeURIComponent(albumKey)}` as never);
  }, [albumKey, router]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const titleShown = showLyrics && hasLyrics;

  const artSize = useMemo(() => {
    const w = Dimensions.get('window').width - 48;
    return Math.max(160, Math.min(w, 480));
  }, []);

  const togglePlay = () => (isPlaying ? void MetalP3Player.pause() : void MetalP3Player.play());
  const cycleRepeat = () => {
    const next: RepeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    void MetalP3Player.setRepeatMode(next);
  };
  const toggleShuffle = async () => {
    const next = !shuffle;
    await MetalP3Player.setShuffle(next);
    if (next) {
      const queue = state?.queue ?? [];
      const idx = state?.currentIndex ?? -1;
      if (queue.length > 1 && idx >= 0) {
        const before = queue.slice(0, idx);
        const after = queue.slice(idx + 1);
        await MetalP3Player.replaceUpcoming(shuffled([...before, ...after]));
      }
    }
  };

  return (
    <View style={[tw`flex-1`, { backgroundColor: theme.background }]}>
      {theme.artworkDataUri ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="player-backdrop">
          <ArtworkImage
            uri={theme.artworkDataUri}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            blurRadius={10}
          />
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, tw`bg-black/30`]} />
        </View>
      ) : null}

      <View
        style={[
          tw`flex-row items-center px-2`,
          { paddingTop: insets.top, height: insets.top + 56 },
        ]}
        testID="player-header"
      >
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={tw`w-10 h-10 items-center justify-center ml-1`}
          hitSlop={8}
          testID="player-menu-toggle"
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Menu
            size={24}
            color={theme.foreground}
            strokeWidth={ICON_STROKE}
            strokeLinecap="square"
          />
        </Pressable>
        {titleShown ? (
          <Pressable
            onPress={openAlbum}
            disabled={!albumKey}
            style={tw`flex-1 items-center justify-center px-2`}
            accessibilityRole="button"
            accessibilityLabel="Open album"
            testID="player-header-album-link"
          >
            <Text
              style={[tw`text-base font-semibold text-center`, { color: theme.foreground }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {headerTitleText}
            </Text>
            {headerSubtitle ? (
              <Text
                style={[tw`text-xs text-center`, { color: theme.mutedForeground }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {headerSubtitle}
              </Text>
            ) : null}
          </Pressable>
        ) : (
          <View style={tw`flex-1`} />
        )}
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
      </View>

      <View
        pointerEvents="box-none"
        style={[
          tw`flex-1 px-6 pt-6`,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {showLyrics && hasLyrics ? (
          hasSynced ? (
            <SyncedLyricsView
              lines={synced.lines!}
              positionMs={state?.positionMs ?? null}
              isPlaying={isPlaying}
              theme={theme}
              testID="player-lyrics-synced"
            />
          ) : (
            <View
              pointerEvents="box-none"
              style={tw`flex-1 items-stretch`}
              testID="player-lyrics"
            >
              <ScrollView
                style={tw`flex-1`}
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
          )
        ) : (
          <View pointerEvents="box-none" style={tw`flex-1 items-center`}>
            <View
              style={[
                tw`max-w-full rounded-[18px] overflow-hidden`,
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
              <View
                style={[
                  tw`absolute inset-0 items-center justify-center`,
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
              <ArtworkImage uri={theme.artworkDataUri} style={tw`w-full h-full`} resizeMode="cover" />
            </View>
            <View style={tw`flex-1 items-center justify-center self-stretch px-2`}>
              <Text
                style={[tw`text-2xl font-extrabold text-center`, withShadow(theme.foreground)]}
                numberOfLines={2}
                testID="player-title"
              >
                {current?.title ?? 'Nothing playing'}
              </Text>
              {artistText || albumText ? (
                <Text
                  style={[tw`mt-2 text-lg font-semibold text-center`, withShadow(theme.mutedForeground)]}
                  numberOfLines={1}
                  testID="player-subtitle"
                >
                  {artistText ? (
                    <Text
                      onPress={albumKey ? openAlbum : undefined}
                      accessibilityRole="button"
                      accessibilityLabel="Open album"
                      testID="player-album-link"
                    >
                      {artistText}
                    </Text>
                  ) : null}
                  {subtitleSeparator}
                  {albumText ? (
                    albumUrl ? (
                      <Text
                        onPress={() => void Linking.openURL(albumUrl)}
                        accessibilityRole="link"
                        accessibilityLabel="Open Metal Archives page"
                        testID="player-album-archives-link"
                        style={[tw`underline`, { color: theme.accent }]}
                      >
                        {albumText}
                      </Text>
                    ) : (
                      <Text
                        onPress={albumKey ? openAlbum : undefined}
                        accessibilityRole="button"
                        accessibilityLabel="Open album"
                      >
                        {albumText}
                      </Text>
                    )
                  ) : null}
                </Text>
              ) : null}
              {genre || flag ? (
                <Text
                  style={[tw`mt-1.5 text-sm text-center`, withShadow(theme.mutedForeground)]}
                  numberOfLines={1}
                  testID="player-genre"
                >
                  {flag ? `${flag}  ` : ''}
                  {genre ?? ''}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        <View style={tw`items-center mt-4`}>
          <PlayerProgressBar
            positionMs={state?.positionMs ?? 0}
            durationMs={state?.durationMs ?? 0}
            isPlaying={isPlaying}
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
              disabled={!canSkipPrev}
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
              disabled={!canSkipNext}
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
  icon: Icon, onPress, theme, testID, filled, disabled,
}: {
  icon: LucideIcon;
  onPress: () => void;
  theme: BtnTheme;
  testID?: string;
  filled?: boolean;
  disabled?: boolean;
}) {
  const color = disabled ? withAlpha(theme.accent, 0.3) : theme.accent;
  return (
    <Pressable
      style={tw`w-14 h-14 items-center justify-center rounded-full`}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Icon
        size={32}
        color={color}
        fill={filled ? color : 'transparent'}
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
  const color = active ? theme.accent : withAlpha(theme.accent, 0.45);
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
