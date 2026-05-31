import { BlurView } from 'expo-blur';
import { Disc3, GripVertical, Trash2, Volume2, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetalP3Media } from '../../modules/metalp3-media';
import { MetalP3Player, type QueueItem } from '../../modules/metalp3-player';
import { withAlpha } from '../lib/color';
import { formatTrackDuration } from '../lib/group-tracks-by-album';
import { tw } from '../lib/tw';
import { ICON_STROKE } from '../theme/icons';
import type { ArtworkTheme } from '../theme/types';

const ART_SIZE = 44;

const ARTWORK_CACHE = new Map<string, string | null>();

function useTrackArtwork(uri: string | null | undefined): string | null {
  const [dataUri, setDataUri] = useState<string | null>(() =>
    uri ? ARTWORK_CACHE.get(uri) ?? null : null,
  );

  useEffect(() => {
    if (!uri) {
      setDataUri(null);
      return;
    }
    if (ARTWORK_CACHE.has(uri)) {
      setDataUri(ARTWORK_CACHE.get(uri) ?? null);
      return;
    }
    let cancelled = false;
    MetalP3Media.getArtworkAsync(uri)
      .then((art) => {
        const value = art ? `data:${art.mimeType};base64,${art.base64}` : null;
        ARTWORK_CACHE.set(uri, value);
        if (!cancelled) setDataUri(value);
      })
      .catch(() => {
        ARTWORK_CACHE.set(uri, null);
        if (!cancelled) setDataUri(null);
      });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return dataUri;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  queue: QueueItem[];
  currentIndex: number;
  theme: ArtworkTheme;
}

export default function QueueSheet({ visible, onClose, queue, currentIndex, theme }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const swipeRefs = useRef(new Map<string, Swipeable>());

  const onDragEnd = ({ from, to }: { from: number; to: number }) => {
    if (from === to) return;
    void MetalP3Player.moveQueueItem(from, to);
  };

  const playIndex = (index: number) => {
    void MetalP3Player.skipToIndex(index);
    onClose();
  };

  const removeIndex = (index: number) => {
    void MetalP3Player.removeQueueItem(index);
  };

  const clearQueue = () => {
    void MetalP3Player.clearQueue();
    onClose();
    router.replace('/(tabs)' as never);
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<QueueItem>) => {
    const index = getIndex() ?? 0;
    const isCurrent = index === currentIndex;
    const rowKey = `${item.id}-${index}`;
    return (
      <ScaleDecorator>
        <Swipeable
          ref={(ref) => {
            if (ref) swipeRefs.current.set(rowKey, ref);
            else swipeRefs.current.delete(rowKey);
          }}
          friction={2}
          rightThreshold={48}
          overshootRight={false}
          enabled={!isActive}
          renderRightActions={() => (
            <Pressable
              onPress={() => {
                swipeRefs.current.get(rowKey)?.close();
                removeIndex(index);
              }}
              style={tw`bg-[#ff3b30] justify-center items-center px-6 min-w-[88px]`}
              testID={`queue-row-remove-${item.id}`}
              accessibilityRole="button"
              accessibilityLabel="Remove from queue"
            >
              <Trash2 size={22} color="#fff" strokeWidth={ICON_STROKE} strokeLinecap="square" />
            </Pressable>
          )}
        >
          <QueueRow
            item={item}
            isActive={isActive}
            isCurrent={isCurrent}
            theme={theme}
            drag={drag}
            onPress={() => playIndex(index)}
          />
        </Swipeable>
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
            { paddingBottom: insets.bottom + 8 },
          ]}
          testID="queue-sheet"
        >
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: withAlpha(theme.background, 0.7) },
            ]}
          />
        <View
          style={[
            tw`flex-row items-center justify-between px-4 py-[14px]`,
            { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.foreground, 0.08) },
          ]}
        >
          <Text style={[tw`text-lg font-bold`, { color: theme.foreground }]}>Up Next</Text>
          <View style={tw`flex-row items-center gap-1`}>
            {queue.length > 0 ? (
              <Pressable
                onPress={clearQueue}
                style={[
                  tw`flex-row items-center gap-1.5 px-3 h-9 rounded-full`,
                  {
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: withAlpha(theme.foreground, 0.2),
                  },
                ]}
                hitSlop={6}
                testID="player-queue-clear"
                accessibilityRole="button"
                accessibilityLabel="Clear queue"
              >
                <Trash2
                  size={16}
                  color={theme.foreground}
                  strokeWidth={ICON_STROKE}
                  strokeLinecap="square"
                />
                <Text style={[tw`text-xs font-bold tracking-[0.4px]`, { color: theme.foreground }]}>
                  Clear
                </Text>
              </Pressable>
            ) : null}
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

interface QueueRowProps {
  item: QueueItem;
  isActive: boolean;
  isCurrent: boolean;
  theme: ArtworkTheme;
  drag: () => void;
  onPress: () => void;
}

function QueueRow({ item, isActive, isCurrent, theme, drag, onPress }: QueueRowProps) {
  const artUri = useTrackArtwork(item.uri);
  const titleColor = isCurrent ? theme.accent : theme.foreground;
  const subColor = isCurrent ? theme.accent : theme.mutedForeground;
  const subtitle = item.artist ?? item.albumArtist ?? '';
  const rowBg = isActive
    ? withAlpha(theme.foreground, 0.08)
    : isCurrent
      ? withAlpha(theme.accent, 0.16)
      : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={drag}
      delayLongPress={200}
      disabled={isActive}
      style={[
        tw`flex-row items-center py-2 px-3`,
        {
          borderBottomWidth: StyleSheet.hairlineWidth,
          backgroundColor: rowBg,
          borderBottomColor: withAlpha(theme.foreground, 0.06),
        },
      ]}
      testID={`queue-row-${item.id}`}
    >
      <View
        style={[
          tw`rounded-md overflow-hidden items-center justify-center`,
          {
            width: ART_SIZE,
            height: ART_SIZE,
            backgroundColor: withAlpha(theme.surface, 0.7),
          },
        ]}
        testID={`queue-row-art-${item.id}`}
      >
        {artUri ? (
          <Image source={{ uri: artUri }} style={tw`w-full h-full`} resizeMode="cover" />
        ) : (
          <Disc3
            size={22}
            color={theme.mutedForeground}
            strokeWidth={ICON_STROKE}
            strokeLinecap="square"
          />
        )}
      </View>
      <View style={tw`w-5 items-center justify-center mx-3`}>
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
      {typeof item.durationMs === 'number' && item.durationMs > 0 ? (
        <Text
          style={[
            tw`text-[13px] mr-2`,
            { color: subColor, fontVariant: ['tabular-nums'] },
          ]}
        >
          {formatTrackDuration(item.durationMs)}
        </Text>
      ) : null}
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
  );
}
