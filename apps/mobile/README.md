# Apna Ghar mobile — React Native Community CLI

This workspace uses React Native Community CLI (not Expo). It now contains the package manifest, TypeScript configuration, Metro/Babel configuration, app entry point, and a branded starter screen with system light/dark theme support.

## Delivery timing: mobile is last

The Android and iOS project directories (`android/` and `ios/`) have not yet been generated. This is intentional during the approved web-first workflow, not an M1 blocker. Finish the public web/marketing experience, admin panel, backend contracts, authentication/security, SEO and data/media integrations before generating the native project and building the APK in the final mobile phase.

When the mobile phase starts, generate the platform project using React Native Community CLI in a compatible environment, align the generated React Native version with this package manifest, and merge the native files without overwriting the root npm workspace.

## Requirements

- Node.js >= 20.11 and npm
- Android: Android Studio, compatible JDK, Android SDK/platform tools, emulator or USB debugging
- iOS: macOS and Xcode; iOS builds are not supported on Windows

## Commands (after native scaffold generation)

- `npm run start -w @apna-ghar/mobile` — Metro bundler
- `npm run android -w @apna-ghar/mobile` — Android build/run
- `npm run ios -w @apna-ghar/mobile` — iOS build/run on macOS
