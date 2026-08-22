import { Play, Shuffle } from 'lucide-react-native';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { tw } from '../lib/tw';
import type { ArtworkTheme } from '../theme/types';

interface PlayShuffleButtonsProps {
  theme: ArtworkTheme;
  onPlay: () => void;
  onShuffle: () => void;
  /** Names what plays, e.g. "album" — read out as "Play album" / "Shuffle album". */
  subject: string;
  /** testIDs become `${testIDPrefix}-play` / `${testIDPrefix}-shuffle`. */
  testIDPrefix: string;
  disabled?: boolean;
  /** Album-detail sizing: smaller padding/icons, buttons stretch to fill the row. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function PlayShuffleButtons({
  theme,
  onPlay,
  onShuffle,
  subject,
  testIDPrefix,
  disabled,
  compact,
  style,
}: PlayShuffleButtonsProps) {
  const buttonBase = compact
    ? tw`flex-1 flex-row items-center justify-center gap-1.5 py-2 px-4 rounded-full`
    : tw`flex-row items-center justify-center gap-2 py-2.5 px-5 rounded-full min-w-[130px]`;
  const iconSize = compact ? 16 : 20;
  const opacity = disabled ? 0.4 : 1;

  return (
    <View style={[tw`flex-row gap-3`, style]}>
      <Pressable
        style={[buttonBase, { backgroundColor: theme.accent, opacity }]}
        disabled={disabled}
        onPress={onPlay}
        testID={`${testIDPrefix}-play`}
        accessibilityRole="button"
        accessibilityLabel={`Play ${subject}`}
      >
        <Play
          size={iconSize}
          color={theme.accentForeground}
          fill={theme.accentForeground}
          strokeWidth={2.5}
          strokeLinecap="square"
        />
        <Text style={[tw`text-sm font-bold tracking-[0.4px]`, { color: theme.accentForeground }]}>
          Play
        </Text>
      </Pressable>
      <Pressable
        style={[
          buttonBase,
          {
            borderWidth: 1.5,
            backgroundColor: theme.surface,
            borderColor: theme.accent,
            opacity,
          },
        ]}
        disabled={disabled}
        onPress={onShuffle}
        testID={`${testIDPrefix}-shuffle`}
        accessibilityRole="button"
        accessibilityLabel={`Shuffle ${subject}`}
      >
        <Shuffle size={iconSize} color={theme.accent} strokeWidth={2.5} strokeLinecap="square" />
        <Text style={[tw`text-sm font-bold tracking-[0.4px]`, { color: theme.accent }]}>
          Shuffle
        </Text>
      </Pressable>
    </View>
  );
}
