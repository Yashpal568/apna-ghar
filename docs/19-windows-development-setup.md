# Windows Local Development Setup

Target: Windows 10/11, 16 GB RAM.

## Install

1. Git for Windows.
2. Node.js LTS meeting the root `engines` requirement (Node >= 20.11; use a current compatible LTS).
3. Visual Studio Code.
4. Android Studio and Android SDK for the native Android app.
5. JDK 17 for React Native Android builds, unless the generated React Native version documents a different supported toolchain.

Official sources:
- Git: https://git-scm.com/download/win
- Node.js: https://nodejs.org/en/download
- VS Code: https://code.visualstudio.com/download
- Android Studio: https://developer.android.com/studio
- React Native environment setup: https://reactnative.dev/docs/set-up-your-environment

## Verify tools

Open PowerShell:

```powershell
git --version
node --version
npm --version
java -version
```

If `java` is not found after installing JDK 17, configure `JAVA_HOME` and add `%JAVA_HOME%\\bin` to PATH, then open a new terminal.

## Get the repository

For a new local checkout:

```powershell
cd $HOME
git clone https://github.com/Yashpal568/apna-ghar.git
cd apna-ghar
code .
```

For an existing checkout, first run `git status`. Do not overwrite uncommitted work. Pull only after confirming the current branch and working tree.

## Inspect before installing

```powershell
git status
git branch --show-current
Get-Content package.json
Get-Content apps/mobile/README.md
```

Follow the root package manager and scripts that are actually committed. Do not run the React Native CLI until the mobile app generation plan is aligned with the repository workspace and the currently supported React Native version.

## Android Studio

Use the setup wizard to install Android SDK and Android Virtual Device components. In SDK Manager, install the SDK platform/build tools required by the generated React Native Android project. Create an emulator if the machine can run it comfortably; a physical Android device with USB debugging is a reasonable alternative on a 16 GB machine.

## Local secrets

Copy `.env.example` to `.env` only when needed. Keep real credentials local and never commit them. Do not put private Clerk keys, database credentials or media-storage secrets into client-side variables.

## First verification

Run only the scripts defined in the current root `package.json`. Build status is not confirmed until the commands complete successfully and the results are recorded.
