# Apna Ghar mobile — React Native Community CLI

This workspace uses React Native Community CLI (not Expo). It now contains the package manifest, TypeScript configuration, Metro/Babel configuration, app entry point, and a branded starter screen with system light/dark theme support.

## M1 blocker: native project files

The Android and iOS project directories (`android/` and `ios/`) have not yet been generated. Until these exist, device builds cannot run. This remains an M1 acceptance blocker; the starter screen alone is not a complete native project.

Generate the platform project using the React Native Community CLI in a compatible environment, align its generated React Native version with this package manifest, and merge the generated native files without overwriting the root npm workspace.

## Requirements

- Node.js >= 20.11 and npm
- Android: Android Studio, compatible JDK, Android SDK/platform tools, emulator or USB debugging
- iOS: macOS and Xcode; iOS builds are not supported on Windows

## Commands (after native scaffold generation)

- `npm run start -w @apna-ghar/mobile` — Metro bundler
- `npm run android -w @apna-ghar/mobile` — Android build/run
- `npm run ios -w @apna-ghar/mobile` — iOS build/run on macOS
