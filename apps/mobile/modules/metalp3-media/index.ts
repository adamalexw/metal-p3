import { requireNativeModule } from 'expo-modules-core';
import { PermissionsAndroid, Platform } from 'react-native';
import type { Artwork, PermissionStatus, ScanOptions, Track, TrackTags } from './src/MetalP3Media.types';

export * from './src/MetalP3Media.types';

interface NativeModule {
  audioPermission: string;
  getPermissionsAsync(): Promise<PermissionStatus>;
  scanAudioAsync(options?: ScanOptions): Promise<Track[]>;
  searchAsync(query: string, limit?: number): Promise<Track[]>;
  getTrackAsync(uri: string): Promise<TrackTags | null>;
  getArtworkAsync(uri: string): Promise<Artwork | null>;
}

const native = requireNativeModule<NativeModule>('MetalP3Media');

async function requestPermissionsAsync(): Promise<PermissionStatus> {
  if (Platform.OS !== 'android') {
    return { granted: false, permission: '' };
  }
  const perm = native.audioPermission as
    | typeof PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
    | typeof PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

  const result = await PermissionsAndroid.request(perm, {
    title: 'Music library access',
    message: 'Metal P3 needs access to your music files to play them.',
    buttonPositive: 'Allow',
    buttonNegative: 'Deny',
  });

  return { granted: result === PermissionsAndroid.RESULTS.GRANTED, permission: perm };
}

export const MetalP3Media = {
  audioPermission: native.audioPermission,
  getPermissionsAsync: () => native.getPermissionsAsync(),
  requestPermissionsAsync,
  scanAudioAsync: (options?: ScanOptions) => native.scanAudioAsync(options),
  searchAsync: (query: string, limit?: number) => native.searchAsync(query, limit),
  getTrackAsync: (uri: string) => native.getTrackAsync(uri),
  getArtworkAsync: (uri: string) => native.getArtworkAsync(uri),
};

export default MetalP3Media;
