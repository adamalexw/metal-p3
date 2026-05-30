import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
      <Pressable style={styles.backdrop} onPress={busy ? undefined : onCancel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
          pointerEvents="box-none"
        >
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.cancelButton, busy && styles.buttonDisabled]}
                onPress={onCancel}
                disabled={busy}
                testID="confirm-delete-cancel"
              >
                <Text style={styles.cancelButtonLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, busy && styles.buttonDisabled]}
                onPress={onConfirm}
                disabled={busy}
                testID="confirm-delete-confirm"
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
              >
                <Text style={styles.confirmButtonLabel}>{confirmLabel}</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  message: { color: '#ccc', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  error: { color: '#ff6b6b', marginBottom: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelButtonLabel: { color: '#aaa', fontSize: 15, fontWeight: '600' },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ff3b30',
  },
  confirmButtonLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  buttonDisabled: { opacity: 0.4 },
});
