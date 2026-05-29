import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useArtworkTheme } from '../../src/theme/useArtworkTheme';
import { MetalP3Player, type PlaybackState } from '../../modules/metalp3-player';

export default function PlayerScreen() {
  const [state, setState] = useState<PlaybackState | null>(null);

  useEffect(() => {
    let mounted = true;
    void MetalP3Player.getStateAsync().then((s) => mounted && setState(s));
    const sub = MetalP3Player.addStateListener((s) => mounted && setState(s));
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const current = state?.current;
  const isPlaying = state?.isPlaying ?? false;
  const theme = useArtworkTheme(current?.uri ?? null);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.art, { backgroundColor: theme.surface }]}>
        {theme.artworkDataUri ? (
          <Image source={{ uri: theme.artworkDataUri }} style={styles.artImage} resizeMode="cover" />
        ) : (
          <Text style={[styles.artGlyph, { color: theme.mutedForeground }]}>
            {current?.title?.[0]?.toUpperCase() ?? '\u266B'}
          </Text>
        )}
      </View>

      <Text style={[styles.title, { color: theme.foreground }]} numberOfLines={2}>
        {current?.title ?? 'Nothing playing'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.mutedForeground }]} numberOfLines={1}>
        {[current?.artist, current?.album].filter(Boolean).join(' \u2014 ') || ' '}
      </Text>

      <Text style={[styles.time, { color: theme.mutedForeground }]}>
        {fmt(state?.positionMs ?? 0)} / {fmt(state?.durationMs ?? 0)}
      </Text>

      <View style={styles.controls}>
        <Btn
          label="\u23EE"
          onPress={() => void MetalP3Player.skipToPrevious()}
          color={theme.foreground}
          background={theme.surface}
        />
        <Btn
          label={isPlaying ? '\u23F8' : '\u25B6'}
          onPress={() => (isPlaying ? void MetalP3Player.pause() : void MetalP3Player.play())}
          color={theme.accentForeground}
          background={theme.accent}
          big
        />
        <Btn
          label="\u23ED"
          onPress={() => void MetalP3Player.skipToNext()}
          color={theme.foreground}
          background={theme.surface}
        />
      </View>
    </View>
  );
}

function Btn({
  label, onPress, color, background, big,
}: { label: string; onPress: () => void; color: string; background: string; big?: boolean }) {
  return (
    <Pressable style={[styles.btn, { backgroundColor: background }, big && styles.btnBig]} onPress={onPress}>
      <Text style={[styles.btnLabel, { color }, big && styles.btnLabelBig]}>{label}</Text>
    </Pressable>
  );
}

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  art: { width: 260, height: 260, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 28, overflow: 'hidden' },
  artImage: { width: '100%', height: '100%' },
  artGlyph: { fontSize: 110, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subtitle: { marginTop: 6, textAlign: 'center' },
  time: { marginTop: 16, fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 28, gap: 24 },
  btn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  btnBig: { width: 72, height: 72, borderRadius: 36 },
  btnLabel: { fontSize: 22 },
  btnLabelBig: { fontSize: 28 },
});
