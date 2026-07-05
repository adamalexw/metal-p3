import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MiniPlayer from '../src/components/MiniPlayer';
import { startArtworkPrefetcher } from '../src/lib/artwork-prefetcher';
import { loadPlaylists, reconcileImportedPlaylists } from '../src/lib/playlist-store';
import { tw } from '../src/lib/tw';

export default function RootLayout() {
  useEffect(() => {
    startArtworkPrefetcher();
  }, []);

  useEffect(() => {
    // Load playlists at startup so the album-list filter (which hides
    // playlist-owned tracks) works before the Playlists tab is visited.
    void loadPlaylists();
    void reconcileImportedPlaylists();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reconcileImportedPlaylists();
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={tw`flex-1`}>
      <SafeAreaProvider>
        {/* eslint-disable-next-line react/style-prop-object */}
        <StatusBar style="light" />
        <View style={tw`flex-1`}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#000' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="album/[key]" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <MiniPlayer />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
