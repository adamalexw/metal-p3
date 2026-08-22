import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { tw } from '../lib/tw';

interface BottomSheetScaffoldProps {
  visible: boolean;
  onClose: () => void;
  /** Blocks backdrop taps (hardware back still fires onClose). */
  backdropDisabled?: boolean;
  panelStyle?: StyleProp<ViewStyle>;
  testID?: string;
  children: ReactNode;
}

export default function BottomSheetScaffold({
  visible,
  onClose,
  backdropDisabled,
  panelStyle,
  testID,
  children,
}: BottomSheetScaffoldProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <Pressable style={tw`flex-1 bg-black/60`} onPress={backdropDisabled ? undefined : onClose}>
        <View style={tw`flex-1 justify-end`} pointerEvents="box-none">
          <Pressable
            style={[tw`rounded-t-2xl px-4 pt-4 pb-6 overflow-hidden`, panelStyle]}
            onPress={() => undefined}
          >
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, tw`bg-black/60`]} />
            {children}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
