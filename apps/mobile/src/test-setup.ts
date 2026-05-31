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

if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (object) => JSON.parse(JSON.stringify(object));
}
