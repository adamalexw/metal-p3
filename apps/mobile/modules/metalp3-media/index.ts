import { requireNativeModule } from 'expo-modules-core';
import { PermissionsAndroid, Platform } from 'react-native';
import type {
  Artwork,
  DeleteTracksResult,
  Lyrics,
  PermissionStatus,
  ScanOptions,
  Track,
  TrackTags,
} from './src/MetalP3Media.types';

export * from './src/MetalP3Media.types';

interface NativeModule {
  audioPermission: string;
  getPermissionsAsync(): Promise<PermissionStatus>;
  scanAudioAsync(options?: ScanOptions): Promise<Track[]>;
  searchAsync(query: string, limit?: number): Promise<Track[]>;
  getTrackAsync(uri: string): Promise<TrackTags | null>;
  getArtworkAsync(uri: string): Promise<Artwork | null>;
  getLyricsAsync(uri: string): Promise<Lyrics | null>;
  deleteTracksAsync(uris: string[]): Promise<DeleteTracksResult>;
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

async function deleteTracksAsync(uris: string[]): Promise<DeleteTracksResult> {
  if (Platform.OS !== 'android') {
    throw new Error('deleteTracksAsync is only supported on Android.');
  }
  return native.deleteTracksAsync(uris);
}

export const MetalP3Media = {
  audioPermission: native.audioPermission,
  getPermissionsAsync: () => native.getPermissionsAsync(),
  requestPermissionsAsync,
  scanAudioAsync: (options?: ScanOptions) => native.scanAudioAsync(options),
  searchAsync: (query: string, limit?: number) => native.searchAsync(query, limit),
  getTrackAsync: (uri: string) => native.getTrackAsync(uri),
  getArtworkAsync: (uri: string) => native.getArtworkAsync(uri),
  getLyricsAsync: (uri: string) => native.getLyricsAsync(uri),
  deleteTracksAsync,
};

export default MetalP3Media;
