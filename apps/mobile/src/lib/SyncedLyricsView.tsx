import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { SyncedLyricsLine } from '../../modules/metalp3-media';
import { tw } from './tw';

interface ThemeColors {
  foreground: string;
  mutedForeground: string;
  accent: string;
}

const TICK_MS = 80;
const LINE_HEIGHT = 32;

export function SyncedLyricsView({
  lines,
  positionMs,
  isPlaying = true,
  testID,
  offsetMs = 0,
}: {
  lines: SyncedLyricsLine[];
  positionMs: number | null | undefined;
  isPlaying?: boolean;
  testID?: string;
  // Lead time in ms to compensate for audio output latency (Bluetooth, sink buffers, etc.).
  // Positive values advance the highlight earlier.
  offsetMs?: number;
}) {
  const scrollRef = useRef<ScrollView | null>(null);
  // The native player only emits stateChanged on discrete events (play/pause/
  // seek/track-change), so positionMs doesn't advance during normal playback.
  // Interpolate locally with wall-clock so the active line keeps tracking.
  const [tickedMs, setTickedMs] = useState<number | null>(positionMs ?? null);

  useEffect(() => {
    if (positionMs == null) {
      setTickedMs(null);
      return;
    }
    setTickedMs(positionMs);
    if (!isPlaying) return;
    const startedAt = Date.now();
    const baseMs = positionMs;
    const id = setInterval(() => {
      setTickedMs(baseMs + (Date.now() - startedAt));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [positionMs, isPlaying]);

  const activeIndex = useMemo(() => {
    if (tickedMs == null) return -1;
    const target = tickedMs + offsetMs;
    let lo = 0;
    let hi = lines.length - 1;
    let answer = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (lines[mid].startMs <= target) {
        answer = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return answer;
  }, [tickedMs, lines, offsetMs]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const offset = Math.max(0, activeIndex * LINE_HEIGHT - LINE_HEIGHT * 3);
    scrollRef.current?.scrollTo({ y: offset, animated: true });
  }, [activeIndex]);

  return (
    <View style={tw`flex-1 items-stretch`} testID={testID}>
      <ScrollView
        ref={scrollRef}
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-12 pt-6`}
        showsVerticalScrollIndicator={false}
      >
        {lines.map((line, idx) => {
          const isActive = idx === activeIndex;
          return (
            <Text
              key={`${idx}-${line.startMs}`}
              style={[
                tw`text-center text-lg`,
                {
                  lineHeight: LINE_HEIGHT,
                  color: '#ffffff',
                  opacity: isActive ? 1.0 : 0.5,
                  fontWeight: isActive ? '700' : '400',
                  textShadowColor: 'rgba(0,0,0,0.7)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                },
              ]}
            >
              {line.text || ' '}
            </Text>
          );
        })}
      </ScrollView>
    </View>
  );
}
