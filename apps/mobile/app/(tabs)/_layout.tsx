import { DrawerContentScrollView, DrawerItemList, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { Image, View } from 'react-native';
import { tw } from '../../src/lib/tw';
import { useNowPlayingState } from '../../src/lib/useNowPlayingState';

function DrawerContent(props: DrawerContentComponentProps) {
  return (
    <DrawerContentScrollView {...props}>
      <View style={tw`items-center py-6 border-b border-neutral-800 mb-2`}>
        <Image
          source={require('../../assets/images/splash-icon.png')}
          style={tw`w-32 h-32`}
          resizeMode="contain"
        />
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
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
        drawerStyle: { backgroundColor: '#111' },
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#888',
        drawerActiveBackgroundColor: '#222',
        sceneStyle: { backgroundColor: '#000' },
      }}
    >
      <Drawer.Screen name="index" options={{ title: 'Library', drawerLabel: 'Library' }} />
      <Drawer.Screen name="playlists" options={{ title: 'Playlists', drawerLabel: 'Playlists' }} />
      <Drawer.Screen
        name="player"
        options={{
          title: 'Now Playing',
          drawerLabel: 'Now Playing',
          drawerItemStyle: hasQueue ? undefined : { display: 'none' },
        }}
      />
    </Drawer>
  );
}
