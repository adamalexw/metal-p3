import { Trash2 } from 'lucide-react-native';
import { createRef, useRef, type ReactNode, type RefObject } from 'react';
import { Pressable } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { tw } from '../lib/tw';
import { ICON_STROKE } from '../theme/icons';

interface SwipeToDeleteRowProps {
  rowHeight: number;
  onDelete: () => void;
  deleteAccessibilityLabel: string;
  ref?: RefObject<SwipeableMethods | null>;
  testID?: string;
  deleteTestID?: string;
  enabled?: boolean;
  children: ReactNode;
}

export default function SwipeToDeleteRow({
  rowHeight,
  onDelete,
  deleteAccessibilityLabel,
  ref,
  testID,
  deleteTestID,
  enabled,
  children,
}: SwipeToDeleteRowProps) {
  return (
    <ReanimatedSwipeable
      ref={ref}
      testID={testID}
      // Pin the swipeable cell to the row height. An explicit height keeps
      // ReanimatedSwipeable's absolutely-positioned action wrappers from
      // inflating the container (under the RN new architecture they otherwise
      // add layout height above the row). The row is absolutely positioned via
      // childrenContainerStyle so it fills this height instead of being pushed down.
      containerStyle={{ height: rowHeight }}
      childrenContainerStyle={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      renderRightActions={() => (
        <Pressable
          style={[tw`bg-[#ff3b30] justify-center items-center px-6 min-w-[96px]`, { height: rowHeight }]}
          onPress={onDelete}
          testID={deleteTestID}
          accessibilityRole="button"
          accessibilityLabel={deleteAccessibilityLabel}
        >
          <Trash2 size={22} color="#fff" strokeWidth={ICON_STROKE} strokeLinecap="square" />
        </Pressable>
      )}
      rightThreshold={48}
      overshootRight={false}
      enabled={enabled}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

export type { SwipeableMethods };

export function useSwipeableRowRefs() {
  const refs = useRef(new Map<string, RefObject<SwipeableMethods | null>>());

  const refForRow = (id: string) => {
    const existing = refs.current.get(id);
    if (existing) return existing;
    const ref = createRef<SwipeableMethods | null>();
    refs.current.set(id, ref);
    return ref;
  };

  const closeRow = (id: string) => {
    refs.current.get(id)?.current?.close();
  };

  return { refForRow, closeRow };
}
