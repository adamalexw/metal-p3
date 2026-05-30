import { Drawer } from 'expo-router/drawer';

export default function TabsLayout() {
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
      <Drawer.Screen name="player" options={{ title: 'Now Playing', drawerLabel: 'Now Playing' }} />
    </Drawer>
  );
}
