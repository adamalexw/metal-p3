### Prompt Contract: delete-tracks-albums-playlists.v1

**Repo:** https://github.com/adamalexw/metal-p3

**Purpose**
- Add the ability to delete (a) audio files for individual tracks via swipe-left on the album detail track list, (b) audio files for entire albums via long-press → context menu on the library album tile, and (c) playlist records via long-press → context menu on the playlists list. Every delete is gated by a custom confirmation modal styled like `AddToPlaylistSheet`.

**Inputs**
- Track-row screen: `apps/mobile/app/album/[key].tsx` — `AlbumDetailScreen` renders tracks with `Pressable` inside a `FlatList`. Existing `onLongPress` opens `AddToPlaylistSheet`; the new swipe-to-delete gesture must coexist with it.
- Library album-tile screen: `apps/mobile/app/(tabs)/index.tsx` — `LibraryScreen` renders `AlbumTile` instances inside `Animated.View` rows. `AlbumTile` (`apps/mobile/src/components/AlbumTile.tsx`) currently exposes only an `onPress` prop.
- Playlists list screen: `apps/mobile/app/(tabs)/playlists/index.tsx` — `PlaylistsListScreen` renders each playlist as a `Pressable` row.
- Playlist store module: `apps/mobile/src/lib/playlist-store.ts` — already exposes `createPlaylist`, `addTrackToPlaylist`, `subscribe`, `getPlaylists`. Lacks a `deletePlaylist` function.
- Library cache module: `apps/mobile/src/lib/library-cache.ts` — exposes `setLibraryTracks`, `getLibraryTracks`, `getAlbumGroups`, `findAlbumGroup`, `clearLibraryCache`. Lacks per-track / per-album removal helpers.
- Native media module (Android, Kotlin): `apps/mobile/modules/metalp3-media/android/src/main/java/expo/modules/metalp3media/MetalP3MediaModule.kt` — currently exposes `getPermissionsAsync`, `scanAudioAsync`, `searchAsync`, `getTrackAsync`, `getArtworkAsync`, `getLyricsAsync`. Has no delete API.
- Native media TS bridge: `apps/mobile/modules/metalp3-media/index.ts` and types at `apps/mobile/modules/metalp3-media/src/MetalP3Media.types.ts`.
- Active queue module (TS bridge): `apps/mobile/modules/metalp3-player/index.ts` — used to detect / clear playback when the now-playing track is deleted.
- Existing custom-modal reference for styling parity: `apps/mobile/src/components/AddToPlaylistSheet.tsx` (Modal + backdrop Pressable + sheet container with `borderTopLeftRadius: 16` / `borderTopRightRadius: 16`, dark `#111` background, error text style `#ff6b6b`).
- Gesture library already installed and registered: `react-native-gesture-handler` (imported at the top of `apps/mobile/app/_layout.tsx`; root wrapped in `GestureHandlerRootView`). Use `Swipeable` from `react-native-gesture-handler` for the track row swipe.
- Active-track id source for "is the deleted track currently playing?" check: `apps/mobile/src/lib/useNowPlayingState.ts` (already used by `AlbumDetailScreen`).

**Output (format + schema)**
- Branch name: `feat/delete-tracks-albums-playlists`.
- New TS module: `apps/mobile/src/components/ConfirmDeleteSheet.tsx` — props `{ visible: boolean; title: string; message: string; confirmLabel?: string; busy?: boolean; onConfirm: () => void; onCancel: () => void }`. Markup mirrors `AddToPlaylistSheet` (Modal + backdrop Pressable + bottom sheet, `#111` background, rounded top corners). Confirm button uses destructive red (`#ff3b30` background, white label); Cancel button matches the existing sheet's cancel styling. Test IDs: `confirm-delete-sheet`, `confirm-delete-cancel`, `confirm-delete-confirm`.
- New native function in `MetalP3MediaModule.kt`: `AsyncFunction("deleteTracksAsync") { uris: List<String> -> ... }`. On Android 11+ (API 30+) call `MediaStore.createDeleteRequest(contentResolver, parsedUris)` and surface the returned `IntentSender` to the JS bridge so the system permission dialog is shown; below API 30 fall back to `contentResolver.delete(uri, null, null)` per-uri. Return shape: `{ deletedUris: List<String>, failedUris: List<String> }`. Throw `CodedException("E_DELETE_*", ...)` for unrecoverable failures. The `IntentSender`-driven flow uses Expo's `Activity.startIntentSenderForResult` and resolves the promise after the system dialog returns — model after the `requestPermissionsAsync` pattern in the existing module.
- Updated TS bridge: `apps/mobile/modules/metalp3-media/index.ts` adds `deleteTracksAsync(uris: string[]): Promise<{ deletedUris: string[]; failedUris: string[] }>`. Type added to `MetalP3Media.types.ts`.
- Library cache update in `apps/mobile/src/lib/library-cache.ts`: new `removeTracksByIds(ids: string[]): AlbumGroup[]` and `removeAlbumByKey(key: string): AlbumGroup[]` helpers. Both return the new `AlbumGroup[]` and notify subscribers (introduce a small subscriber model on the cache mirroring the playlist-store pattern). Also add `subscribe(listener)` + `getAlbumGroups()`-driven subscription.
- Playlist-store update in `apps/mobile/src/lib/playlist-store.ts`: new `deletePlaylist(id: string): Promise<void>` that removes the playlist, persists, and notifies. If `getActivePlaylistId() === id` after deletion, also call `setActivePlaylistId(null)`.
- Playlist hygiene after track delete: when tracks are deleted from disk, iterate every loaded playlist and strip the deleted ids from each `trackIds`, persist, and notify. Implement as `removeTrackIdsFromAllPlaylists(ids: string[]): Promise<void>` in `playlist-store.ts`.
- Queue hygiene after track delete: if any deleted track is in the player's current queue, rebuild the queue without those tracks via `MetalP3Player.setQueueAsync`. If the currently-playing track is deleted, advance to the next surviving track or call `MetalP3Player.stop()` if none remain. Implement this orchestration inside the album-detail delete handler.
- `AlbumDetailScreen` (`apps/mobile/app/album/[key].tsx`): wrap each track row in `<Swipeable>` (`react-native-gesture-handler`). Right-side action threshold: ≥ 96 px reveal triggers a "Delete" red action button (using the same red as the confirm sheet). Tapping the revealed action opens `ConfirmDeleteSheet`. Test IDs: `album-track-swipe-${trackId}`, `album-track-delete-action-${trackId}`.
- `AlbumTile` (`apps/mobile/src/components/AlbumTile.tsx`): add optional `onLongPress?: () => void` prop wired to the existing `Pressable`. `LibraryScreen` (`apps/mobile/app/(tabs)/index.tsx`) passes a handler that opens a new `AlbumContextMenu` modal (sheet style, options: "Delete album"). Selecting Delete opens `ConfirmDeleteSheet`. Test IDs: `album-tile-context-menu-${albumKey}`, `album-context-delete-${albumKey}`.
- `PlaylistsListScreen` (`apps/mobile/app/(tabs)/playlists/index.tsx`): add `onLongPress` to each row that opens a `PlaylistContextMenu` modal with a "Delete playlist" option, which then opens `ConfirmDeleteSheet`. Test IDs: `playlist-row-context-menu-${playlistId}`, `playlist-context-delete-${playlistId}`.
- Tests in `apps/mobile/src/__tests__/`:
  - `confirm-delete-sheet.spec.tsx` — renders, fires `onConfirm` / `onCancel`, respects `busy`.
  - `album-detail.spec.tsx` (extend) — swiping a row reveals the delete action; tapping it opens the confirm sheet; confirming calls `MetalP3Media.deleteTracksAsync` with the row's URI; cancelling does not.
  - `library.spec.tsx` (extend) or new `library-album-context.spec.tsx` — long-press on a tile opens the context menu; selecting Delete → confirm calls `MetalP3Media.deleteTracksAsync` with all URIs of the album group.
  - `playlists-list.spec.tsx` (new) — long-press on a row opens the context menu; selecting Delete → confirm calls `deletePlaylist` and removes the row from the list.
  - `playlist-store.spec.ts` (new or extend if present) — `deletePlaylist` removes the playlist and clears `activePlaylistId` when it matched.

**Constraints / Safety**
- Must run on Android only; iOS is out of scope for this contract — add a guard at the JS bridge boundary that throws a clear "Not supported on this platform" error when `Platform.OS !== 'android'`.
- Must use `react-native-gesture-handler`'s `Swipeable`, not a custom pan-responder; the gesture handler root provider is already wired in `apps/mobile/app/_layout.tsx`.
- Must not introduce a third-party confirm-dialog library. The confirm modal is custom and styled to match `AddToPlaylistSheet`.
- Must not call `Alert.alert` for any of the three delete confirmations.
- Must not delete files synchronously without first showing the custom confirm modal AND, on Android 11+, the system MediaStore permission dialog. Both gates are non-negotiable.
- Track delete on disk must update: (1) library cache, (2) every playlist's `trackIds`, (3) the player queue if the track is queued, (4) playback state if the track is currently playing.
- Album delete on disk is implemented as a single `deleteTracksAsync` call passing every track URI in the `AlbumGroup`. After success it must trigger the same four downstream updates as track delete.
- Playlist delete only removes the playlist record from `playlist-store.ts` storage and from the in-memory `playlists` array; it must NOT delete any track files.
- Confirmation modal copy:
  - Track: title `Delete track?`, message `"<title>" will be permanently removed from your device.` confirm label `Delete`.
  - Album: title `Delete album?`, message `All <N> tracks in "<albumName>" will be permanently removed from your device.` confirm label `Delete`.
  - Playlist: title `Delete playlist?`, message `"<name>" will be removed. The tracks in it will not be deleted.` confirm label `Delete`.
- The Android native delete path must use `MediaStore.createDeleteRequest` on API 30+ so the user sees the system "Allow this app to delete?" dialog. Do not bypass scoped storage with `WRITE_EXTERNAL_STORAGE`.
- Nx-managed verification: after implementation, run lint + tests via Nx for the `mobile` project. Do not invoke Jest directly outside of Nx.
- Self-verification command set (must all pass):
  - `pnpm nx lint mobile`
  - `pnpm nx test mobile`
  - `pnpm nx typecheck mobile` (or whichever typecheck target the workspace exposes — the agent must verify by reading `apps/mobile/project.json` first; if no typecheck target exists, run `pnpm tsc -p apps/mobile/tsconfig.json --noEmit` instead)

**Error Behavior**
- If `apps/mobile/modules/metalp3-media/android/src/main/java/expo/modules/metalp3media/MetalP3MediaModule.kt` cannot be located → block; do not proceed with stub implementations.
- If `react-native-gesture-handler` is not declared in `apps/mobile/package.json` → block (it is currently declared; if it has been removed in the meantime, stop and surface a comment on the work item rather than installing it).
- If `MetalP3Media.deleteTracksAsync` returns a non-empty `failedUris` array → keep the library cache / playlist / queue updates limited to the URIs in `deletedUris` only, and surface the failures to the user via a non-blocking inline error in the confirm sheet (`error` style at the bottom of the sheet) before closing it.
- If the user cancels the system MediaStore permission dialog on Android 11+ → resolve `deleteTracksAsync` with empty `deletedUris` and the requested URIs in `failedUris`. The UI must close the confirm sheet without making any cache / playlist / queue mutations and without showing a generic error.
- If `Platform.OS !== 'android'` at the time the delete UI is invoked → do not show the confirm sheet at all; surface a one-line inline notice on the screen ("Track / album / playlist deletion is only available on Android.") and abort.
- If a unit test referenced above already exists, extend it; do not create a duplicate file with a similar name.
- If `pnpm nx lint mobile` or `pnpm nx test mobile` fails → fix the underlying cause; do not disable rules or skip tests.

**Acceptance Criteria**
- [ ] New file `apps/mobile/src/components/ConfirmDeleteSheet.tsx` exists, exports a default React component matching the prop contract above, and is styled to match `AddToPlaylistSheet`.
- [ ] `apps/mobile/modules/metalp3-media/android/src/main/java/expo/modules/metalp3media/MetalP3MediaModule.kt` declares an `AsyncFunction("deleteTracksAsync")` that uses `MediaStore.createDeleteRequest` on API 30+ and `contentResolver.delete(...)` below API 30, returning `{ deletedUris, failedUris }`.
- [ ] `apps/mobile/modules/metalp3-media/index.ts` re-exports `deleteTracksAsync` and `apps/mobile/modules/metalp3-media/src/MetalP3Media.types.ts` declares its return type.
- [ ] Swiping a row in `AlbumDetailScreen` reveals a red "Delete" action; tapping it opens `ConfirmDeleteSheet` with the track copy specified above. Confirming calls `MetalP3Media.deleteTracksAsync([track.uri])`.
- [ ] After a successful track delete, the library cache, all playlists, and the player queue are updated; if the deleted track was currently playing, playback advances or stops.
- [ ] Long-pressing an `AlbumTile` in the library opens an album context menu with a "Delete album" option that opens `ConfirmDeleteSheet` and, on confirm, calls `deleteTracksAsync` with every URI in the `AlbumGroup`.
- [ ] Long-pressing a row in `PlaylistsListScreen` opens a playlist context menu with a "Delete playlist" option that opens `ConfirmDeleteSheet` and, on confirm, calls a new `deletePlaylist(id)` from `playlist-store.ts`.
- [ ] `playlist-store.ts` exports `deletePlaylist(id: string)` that removes the playlist, persists via AsyncStorage, notifies subscribers, and clears `activePlaylistId` when it matched.
- [ ] No use of `Alert.alert` for delete confirmation in the three new flows.
- [ ] iOS / web: the delete UI is suppressed (or surfaces the not-supported notice) — no crash, no broken layout.
- [ ] `pnpm nx lint mobile` passes.
- [ ] `pnpm nx test mobile` passes (existing tests still green; new tests listed in Output exist and pass).
- [ ] Typecheck passes via the workspace's typecheck target (or `tsc -p apps/mobile/tsconfig.json --noEmit` fallback).
- [ ] Commit message follows the repo's existing style (cf. `git log --oneline -n 10`); PR description explains the four downstream updates triggered by track / album deletion (cache, playlists, queue, playback).
