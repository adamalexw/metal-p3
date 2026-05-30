import { EventSubscription, requireNativeModule } from 'expo-modules-core';
import type { PlaybackState, QueueItem, RepeatMode } from './src/MetalP3Player.types';

export * from './src/MetalP3Player.types';

interface NativeModule {
  setQueueAsync(items: QueueItem[], startIndex?: number, positionMs?: number): Promise<void>;
  playAsync(): Promise<void>;
  pauseAsync(): Promise<void>;
  stopAsync(): Promise<void>;
  seekToAsync(positionMs: number): Promise<void>;
  skipToNextAsync(): Promise<void>;
  skipToPreviousAsync(): Promise<void>;
  setRepeatModeAsync(mode: RepeatMode): Promise<void>;
  setShuffleAsync(on: boolean): Promise<void>;
  moveQueueItemAsync(fromIndex: number, toIndex: number): Promise<void>;
  getStateAsync(): Promise<PlaybackState>;
  addListener(eventName: 'stateChanged', listener: (state: PlaybackState) => void): EventSubscription;
}

const native = requireNativeModule<NativeModule>('MetalP3Player');

export const MetalP3Player = {
  setQueueAsync: (items: QueueItem[], startIndex = 0, positionMs = 0) =>
    native.setQueueAsync(items, startIndex, positionMs),
  play: () => native.playAsync(),
  pause: () => native.pauseAsync(),
  stop: () => native.stopAsync(),
  seekTo: (positionMs: number) => native.seekToAsync(positionMs),
  skipToNext: () => native.skipToNextAsync(),
  skipToPrevious: () => native.skipToPreviousAsync(),
  setRepeatMode: (mode: RepeatMode) => native.setRepeatModeAsync(mode),
  setShuffle: (on: boolean) => native.setShuffleAsync(on),
  moveQueueItem: (fromIndex: number, toIndex: number) =>
    native.moveQueueItemAsync(fromIndex, toIndex),
  getStateAsync: () => native.getStateAsync(),
  addStateListener: (listener: (state: PlaybackState) => void) =>
    native.addListener('stateChanged', listener),
};

export default MetalP3Player;
