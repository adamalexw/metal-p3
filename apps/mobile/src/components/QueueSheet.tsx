import { GripVertical, X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Player, type QueueItem } from '../../modules/metalp3-player';
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

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<QueueItem>) => {
    const index = getIndex();
    const isCurrent = index === currentIndex;
    const titleColor = isCurrent ? theme.accent : theme.foreground;
    const subColor = theme.mutedForeground;
    const subtitle = item.artist ?? item.albumArtist ?? '';

    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          delayLongPress={120}
          disabled={isActive}
          style={[
            styles.row,
            {
              backgroundColor: isActive
                ? withAlpha(theme.foreground, 0.08)
                : 'transparent',
              borderBottomColor: withAlpha(theme.foreground, 0.06),
            },
          ]}
          testID={`queue-row-${item.id}`}
        >
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: titleColor }]} numberOfLines={1}>
              {item.title ?? 'Unknown title'}
            </Text>
            {subtitle ? (
              <Text style={[styles.rowSubtitle, { color: subColor }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPressIn={drag}
            hitSlop={12}
            style={styles.handle}
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
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        testID="queue-sheet-backdrop"
        accessibilityRole="button"
        accessibilityLabel="Close queue"
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.background,
            paddingBottom: insets.bottom + 8,
          },
        ]}
        testID="queue-sheet"
      >
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.foreground, 0.08) }]}>
          <Text style={[styles.title, { color: theme.foreground }]}>Up Next</Text>
          <Pressable
            onPress={onClose}
            style={styles.closeBtn}
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
          containerStyle={styles.list}
          testID="queue-list"
        />
      </View>
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

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '75%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1, paddingRight: 12 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  handle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
