import { Drawer } from 'expo-router/drawer';
import { useNowPlayingState } from '../../src/lib/useNowPlayingState';

export default function TabsLayout() {
  const state = useNowPlayingState();
  const hasQueue = (state?.queue?.length ?? 0) > 0;

  return (
    <Drawer
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
