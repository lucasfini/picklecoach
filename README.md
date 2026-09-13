# PickleCoach

**Get better at pickleball between lessons.**

PickleCoach is an iOS-first React Native / Expo app for recreational pickleball players. It records short controlled practice clips, prepares them for analysis, gives the player one priority, and tracks progress over time.

## Status

The app has a working local camera flow for Serve, Dink, and Drive:

1. Choose a practice type.
2. Review phone-position guidance.
3. Grant camera and microphone access.
4. Record up to 30 seconds with the rear camera.
5. Review, retake, or use the local video.
6. Continue to an explicitly labelled demo analysis result.

Pose estimation is not implemented. Current scores and coaching feedback are fixed demo data and are not derived from the recording.

## Stack

- Expo SDK 57
- React Native 0.86
- React 19.2
- Expo Router
- Expo Camera and Expo Video
- TypeScript

## Run locally

Use Node 22.13 or newer.

```bash
npm install
npx expo install --check
npm run typecheck
npm run start
```

The web build is useful for checking non-camera screens, but camera recording should be tested on a physical device.

## Physical iPhone testing

A development build is required for the normal SDK 57 physical-iPhone workflow. The App Store version of Expo Go only supports through SDK 54, so it cannot open this project. The camera and video modules themselves are Expo-supported; the limitation is availability of a matching Expo Go binary on iPhone.

Build and install the existing EAS development profile:

```bash
npx eas-cli@latest build --profile development --platform ios
npm run start -- --dev-client
```

For a local build with Xcode and a connected iPhone:

```bash
npx expo run:ios --device
npm run start -- --dev-client
```

Then verify each practice type through both paths:

- Record, stop, review, retake, and record again.
- Record, stop, review, use the video, and confirm the demo-analysis banner.
- Let a recording reach 30 seconds and confirm it stops automatically.
- Cancel once while idle and once while recording.
- Deny camera or microphone access and verify retry or Settings recovery.

iOS can retain a previous permission decision. Use Settings to toggle access, or uninstall and reinstall the development build when testing the first-request state.

## Recording lifecycle

Recordings remain in the app's local cache. They are not uploaded. Retake and cancel attempt to delete the discarded file immediately, and the accepted clip is deleted when the analysis screen leaves the flow. The operating system may also purge cached files.

The iOS experience is the current quality target. The implementation uses cross-platform Expo APIs and keeps Android permissions configured, but Android device-specific camera behavior has not been optimized in this milestone. Simulators cannot validate real camera capture.

## Architecture

The feature keeps capture independent from future computer vision:

```text
Camera / Recording
        ↓
RecordedPracticeSession
        ↓
Analysis Service
        ↓
Analysis Result
```

See `docs/architecture.md` before implementing pose estimation or AI coaching. `AGENTS.md` contains the product and engineering rules for Codex.
