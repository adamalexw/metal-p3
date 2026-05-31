import { BlurView } from 'expo-blur';
import { Image, StyleSheet, View } from 'react-native';
import { tw } from '../lib/tw';

/**
 * Soft full-screen backdrop: a giant, blurred, low-opacity image over a
 * dim base. Used behind the Library and Playlists grids so they don't read as
 * a flat black slab.
 */
export default function BlurredBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="blurred-backdrop">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0a0a0a' }]} />
      <View
        style={[
          StyleSheet.absoluteFill,
          tw`items-center justify-center`,
          { opacity: 0.18 },
        ]}
      >
        <Image
          source={require('../../assets/images/library-backdrop.png')}
          style={tw`w-[140%] h-[140%]`}
          resizeMode="cover"
          blurRadius={28}
        />
      </View>
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, tw`bg-black/40`]} />
    </View>
  );
}
