# Metal P3 Mobile (Android)

React Native + Expo Router music player. Android-only.

## Features

- File-based routing (`app/`) with three tabs: Library / Search / Now Playing.
- **`metalp3-media`** native module — scans `MediaStore.Audio`, reads ID3-equivalent tags via `MediaMetadataRetriever`, exposes search and embedded artwork extraction.
- **`metalp3-player`** native module — Media3 `MediaLibraryService` + `ExoPlayer`, audio offload + gapless required for bit-perfect / hi-res output, foreground service with audio focus + becoming-noisy handling.
- **Artwork-driven theming** — Android Palette via `react-native-image-colors`, post-processed for WCAG AA contrast (≥4.5:1 text, ≥3:1 accent) with black/white fallback.
- **4×2 home-screen widget** — `AppWidgetProvider` + `RemoteViews`, transport controls wired through a transient `MediaController`, embedded artwork pushed from the service.
- **Android Auto / Wear OS / Assistant** — `MediaLibrarySession.Callback` exposes Albums / Artists / All Tracks browse tree from MediaStore.

## Prerequisites

- Node + the workspace deps (`npm install` at the repo root).
- JDK 17 (`winget install Microsoft.OpenJDK.17`).
- Android Studio SDK with platform 35 + build-tools 35 + platform-tools.
- `ANDROID_HOME` set, `%ANDROID_HOME%\platform-tools` on `PATH`.

## Common commands (run from repo root)

```pwsh
# generate native android/ project from app.json
npx nx run mobile:prebuild

# install + launch on a connected device
npx nx run mobile:run-android

# wireless ADB target
npx nx run mobile:run-android --device="<ip>:<port>"

# Metro only (when native is already installed)
npx nx run mobile:start

# tests / lint
npx nx run mobile:test
npx nx run mobile:lint
```

## Verifying the home-screen widget

1. Install the app on the device.
2. Long-press the home screen → **Widgets** → **Metal P3 Player** → drop the 4×2 tile.
3. Start playback from the app — title / artist / artwork / play-pause state update live; prev / play-pause / next on the widget drive the service.

## Verifying Android Auto

1. Install **Android Auto** from Play Store on the phone.
2. In Android Auto settings, tap the version banner 10× to unlock **Developer settings** → enable **Unknown sources**.
3. In Developer settings, choose **Start head unit server**.
4. On the desktop, run the Desktop Head Unit:
   ```pwsh
   adb forward tcp:5277 tcp:5277
   & "$env:ANDROID_HOME\extras\google\auto\desktop-head-unit.exe"
   ```
5. Metal P3 appears in the music source list; the browse tree shows **Albums / Artists / All Tracks**.
