# M(etal)P3 (Android)

A native Android music player for your local library, built with Expo + React Native and a pair of custom Kotlin modules. Android-only by design.

## What it does

- Scans the device's audio library on launch and on `MediaStore` change events.
- Plays local files through ExoPlayer (Media3) with no audio processing — bit-perfect for hi-res sources.
- Drives a media notification, lockscreen / Bluetooth / Auto controls, and a 4×2 home-screen widget from a single foreground service.
- Themes the player UI from each track's embedded artwork (Palette + WCAG-checked foreground/accent colours).
- Surfaces playlists alongside albums in Android Auto's browse tree.

## Layout at a glance

| Path | What lives there |
|---|---|
| `app/` | Expo Router screens — `(tabs)/index.tsx` (library), `(tabs)/playlists/`, `(tabs)/player.tsx`, `album/[key].tsx`. |
| `src/components/` | Album/playlist tiles, mini-player, queue sheet, blur backdrop, confirm-delete sheet, etc. |
| `src/lib/` | Pure TS — `library-cache`, `playlist-store`, `delete-tracks`, `useTrackArtwork`, `useNowPlayingState`, `to-queue-item`. |
| `src/theme/` | Artwork-driven palette (`useArtworkTheme`, `contrast`). |
| `src/__tests__/` | Jest specs for the library, playlists, mini-player, queue, contrast, etc. |
| `modules/metalp3-media/` | Kotlin module: MediaStore scan, embedded artwork, file delete propagation. |
| `modules/metalp3-player/` | Kotlin module: ExoPlayer service, BitmapLoader, widget renderer, Android Auto callback. |
| `assets/images/library-backdrop.png` | The "rusty cage" backdrop used behind the library and playlists grids. |

## Native modules

### `metalp3-media`
Scans `MediaStore.Audio`, reads tags via `MediaMetadataRetriever`, exposes:

- `scanAudioAsync({ minDurationMs })` — full library snapshot.
- `getArtworkAsync(uri)` — embedded artwork as a `data:` URI (cached on the JS side via `useTrackArtwork`).
- `addMediaChangedListener` — `ContentObserver`-backed signal so the library refreshes when files are transferred or scanned.
- Permission flow + delete-and-propagate helpers used by track / album / playlist removal.

### `metalp3-player`
Foreground `MediaLibraryService` hosting:

- A single `ExoPlayer` instance with default renderers (no resampling / processing — bit-perfect for local files), `USAGE_MEDIA` audio attributes, audio-becoming-noisy handling, wake-lock.
- A `MediaLibrarySession` exposing the library to **Android Auto**, **Wear OS**, and **Assistant**, with a custom browse tree (Albums + Playlists).
- A `BitmapLoader` for the **media notification / Bluetooth / Auto / lockscreen** that pulls artwork from `MediaMetadata.artworkData` first, then live `player.mediaMetadata` (covers the race where the system asks before the extractor finishes), then `ContentResolver.openInputStream` for `content://media/.../albumart/<id>`, then `MediaMetadataRetriever`.
- A 4×2 **home-screen widget** with title / artist / album-art / palette-coloured controls, driven by a transient `MediaController` via PendingIntents.
- Audio offload is **off** intentionally — media3 1.5.x's offload sleep state can drop auto-advance to silence.

## Build & install

The release script handles everything that a clean Expo prebuild wipes (JVM 17 pin, `react.root` override) and pushes the APK to whatever device adb sees:

```bash
# Full clean build + install (~10 min cold, ~1 min warm with --no-prebuild)
npm run mobile:release-android

# Skip the expo prebuild step — much faster after the first run
npm run mobile:release-android -- --no-prebuild

# Plain dev rebuild via Nx
npx nx run mobile:run-android

# Metro only (native already installed)
npm run mobile

# Reset metro / haste-map / kill stuck packagers
npm run mobile:reset
```

The release config in `android/app/build.gradle` signs with the **debug keystore** committed to the repo. That's fine for personal sideloading — **not** for Play Store distribution.

### Wireless adb

```bash
# On the phone: Settings → Developer options → Wireless debugging → Pair device with code
adb pair <ip>:<pair-port>           # enter pairing code
adb connect <ip>:<adb-port>         # one-time per session
adb devices                         # confirm "device" status
```

The release script's install step picks the first online device automatically.

## Prerequisites

- Node 20+ and the workspace deps (`npm install` at the repo root).
- JDK 17 (`winget install Microsoft.OpenJDK.17`). The root `android/build.gradle` pins every Kotlin subproject to JVM 17 — don't remove that block.
- Android SDK (platform 35, build-tools 35, platform-tools), `ANDROID_HOME` set, `%ANDROID_HOME%\platform-tools` on `PATH`.

## Verifying things work

### Library + playlists
1. Launch — the library grid populates from MediaStore (permission prompt on first run).
2. Long-press an album → context menu (play, shuffle, add to queue, delete).
3. Open an album → swipe-left a track to delete with a confirmation sheet.
4. Playlists tab → create one, drag-reorder tracks, long-press to rename / delete; tiles show a 2×2 mosaic when ≥4 distinct albums are represented.

### Now playing
1. Player screen — artwork-driven gradient theme, draggable queue, lyrics screen accessible from the header.
2. Mini-player anchors above the tab bar across the app.

### Media controls outside the app
1. Pull down the notification shade — title, artist, embedded artwork, transport controls.
2. Lock the phone — same controls on the lockscreen (artwork rendering on the lockscreen itself is gated by an OEM-level toggle on some devices; the notification-shade view is the source of truth).
3. Bluetooth car / smartwatch / Assistant should all show the embedded art.

### Home-screen widget
1. Long-press the home screen → **Widgets** → **Metal P3 Player** → drop the 4×2 tile.
2. Start playback from the app — title / artist / artwork / play-pause state update live; prev / play-pause / next on the widget drive the service.

### Android Auto
1. Install **Android Auto** on the phone.
2. Tap the version banner 10× → **Developer settings** → enable **Unknown sources**.
3. Choose **Start head unit server**.
4. On the desktop:
   ```bash
   adb forward tcp:5277 tcp:5277
   "$ANDROID_HOME/extras/google/auto/desktop-head-unit.exe"
   ```
5. Metal P3 appears as a media source; the browse tree exposes Albums + Playlists.

## Tests + lint

```bash
npx nx run mobile:test
npx nx run mobile:lint
```

Specs cover the library grid, playlists list, mini-player, queue sheet, album-detail screen, contrast helpers, and the playlist store. Native modules aren't unit-tested — they're exercised manually via the verification flows above.

## Things to know if you're modifying native code

- **After `expo prebuild --clean`:** the script overwrites `android/build.gradle` (loses the JVM 17 pin) and `android/app/build.gradle` (loses `root = file("../../../..")`). Both are reapplied automatically by `tools/scripts/mobile-release-android.mjs` and `mobile-prebuild-android.mjs`. If you build manually with `./gradlew assembleRelease`, run the release script first or reapply by hand.
- **Don't `gradlew clean`** — CMake fails before codegen has run. Use `expo prebuild --clean` instead.
- **The "rusty cage" backdrop** is `assets/images/library-backdrop.png`, rendered by `src/components/BlurredBackdrop.tsx` behind the library and playlists grids only.
