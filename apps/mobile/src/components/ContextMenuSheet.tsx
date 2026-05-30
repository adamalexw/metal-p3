import type { LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { tw } from '../lib/tw';

export interface ContextMenuItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  destructive?: boolean;
  onPress: () => void;
  testID?: string;
}

interface ContextMenuSheetProps {
  visible: boolean;
  title?: string;
  items: ContextMenuItem[];
  onClose: () => void;
  testID?: string;
}

export default function ContextMenuSheet({
  visible,
  title,
  items,
  onClose,
  testID,
}: ContextMenuSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <Pressable style={tw`flex-1 bg-black/60`} onPress={onClose}>
        <View style={tw`flex-1 justify-end`} pointerEvents="box-none">
          <Pressable
            style={tw`bg-[#111] rounded-t-2xl px-4 pt-4 pb-6`}
            onPress={() => undefined}
          >
            {title ? (
              <Text style={tw`text-white text-base font-bold mb-1`}>{title}</Text>
            ) : null}
            {items.map((item) => {
              const Icon = item.icon;
              const tint = item.destructive ? '#ff453a' : '#ffffff';
              return (
                <Pressable
                  key={item.key}
                  style={[
                    tw`flex-row items-center py-[14px] px-2 border-b border-white/[0.08]`,
                    { borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                  onPress={() => {
                    onClose();
                    item.onPress();
                  }}
                  testID={item.testID}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  {Icon ? (
                    <View style={tw`w-7 mr-3 items-center justify-center`}>
                      <Icon size={20} color={tint} strokeWidth={2.25} strokeLinecap="square" />
                    </View>
                  ) : null}
                  <Text
                    style={tw.style(
                      'text-base',
                      item.destructive ? 'text-[#ff453a] font-semibold' : 'text-white',
                    )}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
