import { BlurView } from 'expo-blur';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { tw } from '../lib/tw';

interface ConfirmAction {
  label: string;
  onPress: () => void;
  testID?: string;
}

interface ConfirmDeleteSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  /**
   * When supplied, shown as a second destructive button stacked above the
   * primary confirm button (e.g. "Delete playlist + files" alongside
   * "Delete playlist only"). Useful when the action has two valid forms.
   */
  secondaryConfirm?: ConfirmAction;
}

export default function ConfirmDeleteSheet({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  busy,
  error,
  onConfirm,
  onCancel,
  secondaryConfirm,
}: ConfirmDeleteSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID="confirm-delete-sheet"
    >
      <Pressable style={tw`flex-1 bg-black/60`} onPress={busy ? undefined : onCancel}>
        <View style={tw`flex-1 justify-end`} pointerEvents="box-none">
          <Pressable
            style={tw`rounded-t-2xl px-4 pt-4 pb-6 overflow-hidden`}
            onPress={() => undefined}
          >
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, tw`bg-black/60`]} />
            <Text style={tw`text-white text-lg font-bold mb-2`}>{title}</Text>
            <Text style={tw`text-[#ccc] text-sm leading-5 mb-4`}>{message}</Text>
            {error ? (
              <Text style={tw`text-[#ff6b6b] mb-3`}>{error}</Text>
            ) : null}
            {secondaryConfirm ? (
              <View style={tw`gap-2`}>
                <Pressable
                  style={tw.style('py-3 rounded-lg bg-[#ff3b30] items-center', busy && 'opacity-40')}
                  onPress={secondaryConfirm.onPress}
                  disabled={busy}
                  testID={secondaryConfirm.testID}
                  accessibilityRole="button"
                  accessibilityLabel={secondaryConfirm.label}
                >
                  <Text style={tw`text-white text-[15px] font-bold`}>{secondaryConfirm.label}</Text>
                </Pressable>
                <Pressable
                  style={tw.style('py-3 rounded-lg bg-[#ff3b30] items-center', busy && 'opacity-40')}
                  onPress={onConfirm}
                  disabled={busy}
                  testID="confirm-delete-confirm"
                  accessibilityRole="button"
                  accessibilityLabel={confirmLabel}
                >
                  <Text style={tw`text-white text-[15px] font-bold`}>{confirmLabel}</Text>
                </Pressable>
                <Pressable
                  style={tw.style('py-3 rounded-lg items-center', busy && 'opacity-40')}
                  onPress={onCancel}
                  disabled={busy}
                  testID="confirm-delete-cancel"
                >
                  <Text style={tw`text-[#aaa] text-[15px] font-semibold`}>Cancel</Text>
                </Pressable>
              </View>
            ) : (
              <View style={tw`flex-row justify-end gap-2`}>
                <Pressable
                  style={tw.style('py-2.5 px-4 rounded-lg', busy && 'opacity-40')}
                  onPress={onCancel}
                  disabled={busy}
                  testID="confirm-delete-cancel"
                >
                  <Text style={tw`text-[#aaa] text-[15px] font-semibold`}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={tw.style('py-2.5 px-4 rounded-lg bg-[#ff3b30]', busy && 'opacity-40')}
                  onPress={onConfirm}
                  disabled={busy}
                  testID="confirm-delete-confirm"
                  accessibilityRole="button"
                  accessibilityLabel={confirmLabel}
                >
                  <Text style={tw`text-white text-[15px] font-bold`}>{confirmLabel}</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
