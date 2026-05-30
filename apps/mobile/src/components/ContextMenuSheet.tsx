import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export interface ContextMenuItem {
  key: string;
  label: string;
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
      animationType={Platform.OS === 'ios' ? 'slide' : 'fade'}
      onRequestClose={onClose}
      testID={testID}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.flex} pointerEvents="box-none">
          <Pressable style={styles.sheet} onPress={() => undefined}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {items.map((item) => (
              <Pressable
                key={item.key}
                style={styles.row}
                onPress={() => {
                  onClose();
                  item.onPress();
                }}
                testID={item.testID}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Text style={[styles.rowLabel, item.destructive && styles.destructive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </View>
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
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowLabel: { color: '#fff', fontSize: 16 },
  destructive: { color: '#ff453a', fontWeight: '600' },
});
