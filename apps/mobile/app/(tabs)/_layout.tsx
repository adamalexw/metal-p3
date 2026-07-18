import { BlurView } from 'expo-blur';
import { Drawer, DrawerContentScrollView, DrawerItemList } from 'expo-router/drawer';
import { Disc3, ListMusic, Music4 } from 'lucide-react-native';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { tw } from '../../src/lib/tw';
import { useNowPlayingState } from '../../src/lib/useNowPlayingState';

function DrawerContent(props: any) {
  return (
    <View style={tw`flex-1`}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, tw`bg-black/60`]} />
      <DrawerContentScrollView {...props}>
        <View style={tw`items-center py-8 border-b border-white/[0.08] mb-2`}>
          <Image
            source={require('../../assets/images/splash-icon.png')}
            style={tw`w-56 h-56`}
            contentFit="contain"
          />
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    </View>
  );
}

export default function TabsLayout() {
  const state = useNowPlayingState();
  const hasQueue = (state?.queue?.length ?? 0) > 0;

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        drawerStyle: { backgroundColor: 'transparent' },
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#bbb',
        drawerActiveBackgroundColor: 'rgba(255,255,255,0.12)',
        sceneStyle: { backgroundColor: '#000' },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Library',
          drawerLabel: 'Library',
          headerShown: false,
          drawerIcon: ({ color }) => (
            <Disc3 size={22} color={color} strokeWidth={2.25} strokeLinecap="square" />
          ),
        }}
      />
      <Drawer.Screen
        name="playlists"
        options={{
          title: 'Playlists',
          drawerLabel: 'Playlists',
          headerShown: false,
          drawerIcon: ({ color }) => (
            <ListMusic size={22} color={color} strokeWidth={2.25} strokeLinecap="square" />
          ),
        }}
      />
      <Drawer.Screen
        name="player"
        options={{
          title: 'Now Playing',
          drawerLabel: 'Now Playing',
          drawerItemStyle: hasQueue ? undefined : { display: 'none' },
          drawerIcon: ({ color }) => (
            <Music4 size={22} color={color} strokeWidth={2.25} strokeLinecap="square" />
          ),
        }}
      />
    </Drawer>
  );
}
