import { GripVertical, Volume2, X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Player, type QueueItem } from '../../modules/metalp3-player';
import { tw } from '../lib/tw';
import type { ArtworkTheme } from '../theme/types';

const ICON_STROKE = 2.5;

interface Props {
  visible: boolean;
  onClose: () => void;
  queue: QueueItem[];
  currentIndex: number;
  theme: ArtworkTheme;
}

export default function QueueSheet({ visible, onClose, queue, currentIndex, theme }: Props) {
  const insets = useSafeAreaInsets();

  const onDragEnd = ({ from, to }: { from: number; to: number }) => {
    if (from === to) return;
    void MetalP3Player.moveQueueItem(from, to);
  };

  const playIndex = (index: number) => {
    void MetalP3Player.skipToIndex(index);
    onClose();
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<QueueItem>) => {
    const index = getIndex() ?? 0;
    const isCurrent = index === currentIndex;
    const titleColor = isCurrent ? theme.accent : theme.foreground;
    const subColor = isCurrent ? theme.accent : theme.mutedForeground;
    const subtitle = item.artist ?? item.albumArtist ?? '';
    const rowBg = isActive
      ? withAlpha(theme.foreground, 0.08)
      : isCurrent
        ? withAlpha(theme.accent, 0.16)
        : 'transparent';

    return (
      <ScaleDecorator>
        <Pressable
          onPress={() => playIndex(index)}
          onLongPress={drag}
          delayLongPress={200}
          disabled={isActive}
          style={[
            tw`flex-row items-center py-3 px-4`,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              backgroundColor: rowBg,
              borderBottomColor: withAlpha(theme.foreground, 0.06),
            },
          ]}
          testID={`queue-row-${item.id}`}
        >
          <View style={tw`w-6 items-center justify-center mr-1`}>
            {isCurrent ? (
              <Volume2
                size={16}
                color={theme.accent}
                strokeWidth={ICON_STROKE}
                strokeLinecap="square"
              />
            ) : null}
          </View>
          <View style={tw`flex-1 pr-3`}>
            <Text
              style={[
                tw`text-[15px]`,
                isCurrent ? tw`font-bold` : tw`font-semibold`,
                { color: titleColor },
              ]}
              numberOfLines={1}
            >
              {item.title ?? 'Unknown title'}
            </Text>
            {subtitle ? (
              <Text style={[tw`text-xs mt-0.5`, { color: subColor }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPressIn={drag}
            hitSlop={12}
            style={tw`w-10 h-10 items-center justify-center`}
            testID={`queue-handle-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel="Drag to reorder"
          >
            <GripVertical
              size={22}
              color={theme.mutedForeground}
              strokeWidth={ICON_STROKE}
              strokeLinecap="square"
            />
          </Pressable>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={tw`flex-1`}>
        <Pressable
          style={tw`flex-1 bg-black/40`}
          onPress={onClose}
          testID="queue-sheet-backdrop"
          accessibilityRole="button"
          accessibilityLabel="Close queue"
        />
        <View
          style={[
            tw`absolute left-0 right-0 bottom-0 h-3/4 rounded-t-2xl overflow-hidden`,
            {
              backgroundColor: theme.background,
              paddingBottom: insets.bottom + 8,
            },
          ]}
          testID="queue-sheet"
        >
        <View
          style={[
            tw`flex-row items-center justify-between px-4 py-[14px]`,
            { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.foreground, 0.08) },
          ]}
        >
          <Text style={[tw`text-lg font-bold`, { color: theme.foreground }]}>Up Next</Text>
          <Pressable
            onPress={onClose}
            style={tw`w-9 h-9 items-center justify-center`}
            hitSlop={8}
            testID="player-queue-close"
            accessibilityRole="button"
            accessibilityLabel="Close queue"
          >
            <X
              size={24}
              color={theme.foreground}
              strokeWidth={ICON_STROKE}
              strokeLinecap="square"
            />
          </Pressable>
        </View>
          <DraggableFlatList
            data={queue}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            onDragEnd={onDragEnd}
            renderItem={renderItem}
            activationDistance={8}
            containerStyle={tw`flex-1`}
            testID="queue-list"
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const a = Math.max(0, Math.min(1, alpha));
  const aHex = Math.round(a * 255).toString(16).padStart(2, '0');
  return `#${m[1]}${aHex}`;
}
