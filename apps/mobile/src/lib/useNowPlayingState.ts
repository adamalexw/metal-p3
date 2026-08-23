import { useSyncExternalStore } from 'react';
import { MetalP3Player, type PlaybackState } from '../../modules/metalp3-player';

type Listener = () => void;

// Single native subscription shared by every consumer. Screens that only need
// a slice (a boolean, the current track id) use the selector hooks below so a
// queue edit or play/pause doesn't re-render them.
let state: PlaybackState | null = null;
let started = false;
const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (err) {
      console.warn('now-playing listener threw', err);
    }
  }
}

function refresh(): void {
  void MetalP3Player.getStateAsync()
    .then((s) => {
      state = s;
      notify();
    })
    .catch(() => undefined);
}

function start(): void {
  if (!started) {
    started = true;
    MetalP3Player.addStateListener((s) => {
      state = s;
      notify();
    });
  }
  // Re-sync on the 0 → 1 subscriber transition: events fired while nothing
  // was mounted still land via the persistent listener, but this covers a
  // getStateAsync that failed or a snapshot taken before the module loaded.
  if (listeners.size === 0) refresh();
}

function subscribe(listener: Listener): () => void {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getState(): PlaybackState | null {
  return state;
}

export function useNowPlayingState(): PlaybackState | null {
  return useSyncExternalStore(subscribe, getState, getState);
}

const getHasQueue = () => (state?.queue?.length ?? 0) > 0;
const getHasCurrentTrack = () => !!state?.current;
const getCurrentTrackId = () => state?.current?.id ?? null;

/** True when the queue is non-empty. */
export function useHasQueue(): boolean {
  return useSyncExternalStore(subscribe, getHasQueue, getHasQueue);
}

/** True when a track is loaded — i.e. the mini player is showing. */
export function useHasCurrentTrack(): boolean {
  return useSyncExternalStore(subscribe, getHasCurrentTrack, getHasCurrentTrack);
}

export function useCurrentTrackId(): string | null {
  return useSyncExternalStore(subscribe, getCurrentTrackId, getCurrentTrackId);
}

export function _resetForTests(): void {
  state = null;
  started = false;
  listeners.clear();
}
