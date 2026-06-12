import { EventSubscription, requireNativeModule } from 'expo-modules-core';
import type { ImportManifestsResult, PlaybackState, QueueItem, RepeatMode } from './src/MetalP3Player.types';

export * from './src/MetalP3Player.types';

interface NativeModule {
  setQueueAsync(items: QueueItem[], startIndex?: number, positionMs?: number): Promise<void>;
  addToQueueAsync(items: QueueItem[]): Promise<void>;
  playAsync(): Promise<void>;
  pauseAsync(): Promise<void>;
  stopAsync(): Promise<void>;
  seekToAsync(positionMs: number): Promise<void>;
  skipToNextAsync(): Promise<void>;
  skipToPreviousAsync(): Promise<void>;
  skipToIndexAsync(index: number): Promise<void>;
  setRepeatModeAsync(mode: RepeatMode): Promise<void>;
  setShuffleAsync(on: boolean): Promise<void>;
  replaceUpcomingAsync(items: QueueItem[]): Promise<void>;
  moveQueueItemAsync(fromIndex: number, toIndex: number): Promise<void>;
  removeQueueItemAsync(index: number): Promise<void>;
  clearQueueAsync(): Promise<void>;
  getStateAsync(): Promise<PlaybackState>;
  setPlaylistsAsync(json: string): Promise<void>;
  importPlaylistManifestsAsync(): Promise<ImportManifestsResult>;
  addListener(eventName: 'stateChanged', listener: (state: PlaybackState) => void): EventSubscription;
}

const native = requireNativeModule<NativeModule>('MetalP3Player');

export const MetalP3Player = {
  setQueueAsync: (items: QueueItem[], startIndex = 0, positionMs = 0) =>
    native.setQueueAsync(items, startIndex, positionMs),
  addToQueueAsync: (items: QueueItem[]) => native.addToQueueAsync(items),
  play: () => native.playAsync(),
  pause: () => native.pauseAsync(),
  stop: () => native.stopAsync(),
  seekTo: (positionMs: number) => native.seekToAsync(positionMs),
  skipToNext: () => native.skipToNextAsync(),
  skipToPrevious: () => native.skipToPreviousAsync(),
  skipToIndex: (index: number) => native.skipToIndexAsync(index),
  setRepeatMode: (mode: RepeatMode) => native.setRepeatModeAsync(mode),
  setShuffle: (on: boolean) => native.setShuffleAsync(on),
  replaceUpcoming: (items: QueueItem[]) => native.replaceUpcomingAsync(items),
  moveQueueItem: (fromIndex: number, toIndex: number) =>
    native.moveQueueItemAsync(fromIndex, toIndex),
  removeQueueItem: (index: number) => native.removeQueueItemAsync(index),
  clearQueue: () => native.clearQueueAsync(),
  getStateAsync: () => native.getStateAsync(),
  setPlaylists: (json: string) => native.setPlaylistsAsync(json),
  importPlaylistManifests: (): Promise<ImportManifestsResult> => native.importPlaylistManifestsAsync(),
  addStateListener: (listener: (state: PlaybackState) => void) =>
    native.addListener('stateChanged', listener),
};

export default MetalP3Player;
