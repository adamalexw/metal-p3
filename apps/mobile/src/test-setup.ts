jest.mock('expo/src/winter/ImportMetaRegistry', () => ({
  ImportMetaRegistry: {
    get url() {
      return null;
    },
  },
}));

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { __esModule: true, BlurView: View };
});

jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return { __esModule: true, FlashList: FlatList };
});

jest.mock('expo-image', () => {
  const { Image } = require('react-native');
  return { __esModule: true, Image };
});

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = require('react');
  const { View } = require('react-native');
  const ReanimatedSwipeable = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      close: () => undefined,
      openLeft: () => undefined,
      openRight: () => undefined,
      reset: () => undefined,
    }));
    return React.createElement(
      View,
      { testID: props.testID },
      props.children,
      props.renderRightActions ? props.renderRightActions() : null,
    );
  });
  return { __esModule: true, default: ReanimatedSwipeable };
});

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { Pressable, View } = require('react-native');

  // Minimal Gesture builder: fluent API stashes callbacks on the gesture
  // object so GestureDetector below can wire them through to a Pressable.
  function makeGesture(kind) {
    const handlers = {};
    const g = { __handlers: handlers };
    const fluent = () => g;
    g.onBegin = fluent;
    g.onFinalize = fluent;
    g.onStart = (cb) => {
      if (kind === 'longpress') handlers.onLongPress = () => cb();
      return g;
    };
    g.onEnd = (cb) => {
      if (kind === 'tap') handlers.onTap = () => cb();
      return g;
    };
    g.onTouchesDown = fluent;
    g.onTouchesUp = fluent;
    g.minDuration = fluent;
    g.maxDuration = fluent;
    g.numberOfTaps = fluent;
    return g;
  }

  const Gesture = {
    Tap: () => makeGesture('tap'),
    LongPress: () => makeGesture('longpress'),
    Race: (...gestures) => {
      const merged = {};
      for (const g of gestures) {
        if (g.__handlers.onTap) merged.onTap = g.__handlers.onTap;
        if (g.__handlers.onLongPress) merged.onLongPress = g.__handlers.onLongPress;
      }
      return { __handlers: merged };
    },
  };

  function GestureDetector({ gesture, children }) {
    const handlers = (gesture && gesture.__handlers) || {};
    // Hoist the child's testID/accessibility props onto the Pressable so
    // tests that look up `getByTestId(...)` can fire press/longPress events.
    // Strip them from the child to avoid duplicate testIDs in the tree.
    const child = React.Children.toArray(children)[0];
    const childProps = (child && child.props) || {};
    const stripped = child
      ? React.cloneElement(child, {
          testID: undefined,
          accessibilityRole: undefined,
          accessibilityLabel: undefined,
        })
      : null;
    return React.createElement(
      Pressable,
      {
        onPress: handlers.onTap,
        onLongPress: handlers.onLongPress,
        testID: childProps.testID,
        accessibilityRole: childProps.accessibilityRole,
        accessibilityLabel: childProps.accessibilityLabel,
      },
      stripped,
    );
  }

  const Swipeable = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ close: () => undefined }));
    return React.createElement(
      View,
      { testID: props.testID },
      props.children,
      props.renderRightActions ? props.renderRightActions() : null,
    );
  });

  const GestureHandlerRootView = ({ children, style }) =>
    React.createElement(View, { style }, children);

  return {
    __esModule: true,
    Gesture,
    GestureDetector,
    Swipeable,
    GestureHandlerRootView,
  };
});

jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  const { View, FlatList, Text, Image } = RN;
  const stubEntering: any = new Proxy(() => stubEntering, {
    get: () => stubEntering,
  });
  return {
    __esModule: true,
    default: {
      View,
      FlatList,
      Text,
      Image,
      createAnimatedComponent: (c: unknown) => c,
    },
    View,
    FlatList,
    Text,
    Image,
    FadeIn: stubEntering,
    FadeInDown: stubEntering,
    FadeInUp: stubEntering,
    ZoomIn: stubEntering,
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    interpolate: () => 0,
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    useAnimatedScrollHandler: () => () => undefined,
    withSpring: (v: unknown) => v,
    withTiming: (v: unknown) => v,
  };
});

jest.mock('react-native-worklets', () => ({
  __esModule: true,
  runOnJS:
    <T extends (..._args: unknown[]) => unknown>(fn: T) =>
    (...args: Parameters<T>) =>
      fn(...args),
  runOnUI: <T extends (..._args: unknown[]) => unknown>(fn: T) => fn,
  scheduleOnRN:
    <T extends (..._args: unknown[]) => unknown>(fn: T, ...args: Parameters<T>) =>
      fn(...args),
}));

if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (object) => JSON.parse(JSON.stringify(object));
}


// Expo SDK 55+ installs lazy winter-runtime globals (fetch, URL, etc.) that
// require files Jest treats as "outside of the scope of the test code" in a
// monorepo. Replace them with the runtime's own globals so the lazy getters
// never fire during tests.
const defineGlobal = (name, value) => {
  try {
    Object.defineProperty(global, name, {
      value,
      configurable: true,
      writable: true,
    });
  } catch {
    // Ignore environments that don't allow redefining these globals.
  }
};
defineGlobal('fetch', globalThis.fetch);
defineGlobal('Headers', globalThis.Headers);
defineGlobal('Request', globalThis.Request);
defineGlobal('Response', globalThis.Response);
defineGlobal('FormData', globalThis.FormData);
defineGlobal('URL', globalThis.URL);
defineGlobal('URLSearchParams', globalThis.URLSearchParams);
