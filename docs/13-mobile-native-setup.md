# Mobile native setup (React Native Community CLI)

Apna Ghar uses React Native Community CLI, not Expo. The repository's mobile package currently contains the JavaScript/TypeScript app scaffold. The native `android/` and `ios/` projects must exist before the mobile app can be built or run on a device.

## Android (Windows, macOS, or Linux)

1. Install Node.js compatible with the repository's React Native version and install the workspace dependencies from the repository root with `npm install`.
2. Install Android Studio and its Android SDK, platform tools, command-line tools, and an Android emulator. A physical Android device with Developer options and USB debugging enabled can be used instead.
3. Install a compatible JDK (JDK 17 is the usual baseline for this React Native generation).
4. Configure `ANDROID_HOME` and add `platform-tools` and `emulator` to your PATH. Confirm a connected device with `adb devices`.
5. From the repository root, start Metro with `npm run dev:mobile`; in another terminal use `npm run android -w @apna-ghar/mobile` after the native Android project has been generated and committed.

## iOS (macOS only)

Install Xcode and its Command Line Tools, install CocoaPods, and use a macOS machine. After the `ios/` project exists, install its pods from that project and run `npm run ios -w @apna-ghar/mobile`. iOS builds cannot be performed on Windows or Linux.

## Native CI scope

The current GitHub Actions workflow runs on Ubuntu and validates TypeScript, API tests/build, and the Next.js web build. It does **not** build Android or iOS binaries. Add platform-specific CI only after the generated native projects are checked in and the required platform runners/tooling are configured.

## M1 acceptance gate

Do not mark mobile foundation complete until both native project directories are committed, the Android project builds on an Android-capable runner or developer machine, and iOS project configuration is verified on macOS. A TypeScript check alone does not prove native buildability.
