import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';
import { tw } from '../lib/tw';

interface ConfirmDeleteSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={tw`flex-1 justify-end`}
          pointerEvents="box-none"
        >
          <Pressable
            style={tw`bg-[#111] rounded-t-2xl px-4 pt-4 pb-6`}
            onPress={() => undefined}
          >
            <Text style={tw`text-white text-lg font-bold mb-2`}>{title}</Text>
            <Text style={tw`text-[#ccc] text-sm leading-5 mb-4`}>{message}</Text>
            {error ? (
              <Text style={tw`text-[#ff6b6b] mb-3`}>{error}</Text>
            ) : null}
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
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
