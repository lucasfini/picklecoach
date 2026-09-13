# PickleCoach

**Get better at pickleball between lessons.**

PickleCoach is an iOS-first Expo app for recreational pickleball players. It guides a player through a short, controlled practice recording, checks whether the body can be tracked, and will eventually turn measured movement into one useful coaching priority.

## Current product

The local prototype now includes:

- A focused level-and-goals onboarding flow.
- A photo-led Today screen for Serve, Dink, and Drive.
- Per-skill phone placement and full-body framing guidance.
- Camera permission recovery without requesting microphone access.
- Silent 720p rear-camera recording with a five-second get-into-position countdown, manual stop, a 30-second cap, and a 75 MB safety limit.
- Immediate cleanup and retry guidance for clips shorter than five seconds.
- Local playback, retake, cancellation, and file cleanup.
- On-device Apple Vision 2D body-landmark extraction on iPhone.
- A synchronized skeleton overlay with tracking-quality statistics.
- Retake states when the player is missing, too small, partially cropped, or inconsistently tracked.
- Local practice history that records session metadata, not video or technique scores.
- An ephemeral accepted-clip handoff that keeps raw-video URIs out of routes and local JSON.
- A dedicated temporary-recording cache with crash-recovery cleanup and visible local-data controls.
- VoiceOver semantics, WCAG AA small-text color pairs, and layouts hardened for Accessibility text sizes.
- Branded recovery for invalid links, failed local saves, and unexpected screen errors.
- A structured development-only 16-case pose benchmark with device provenance, visual review, repeatability, and privacy-safe report sharing.

The pose proof of concept extracts landmarks only. It does **not** calculate technique metrics or scores yet. Every coaching score, explanation, and drill currently shown is fixed demo content and is visibly labelled **DEMO DATA · NOT VIDEO-DERIVED**. Serve, Dink, and Drive use different example copy, but none of it describes the recorded clip.

## Stack

- Expo SDK 57 and Expo Router
- React Native 0.86 and React 19.2
- TypeScript in strict mode
- Expo Camera, Video, Image Picker, File System, Device, and Font
- A local Expo module written in Swift
- Apple Vision `VNDetectHumanBodyPoseRequest`

## Run locally

Use Node 22.13 or newer.

```bash
npm install
npx expo install --check
npm test
npm run typecheck
npm run doctor
npm run start
```

The web build is useful for non-camera UI. Camera capture and the Apple Vision module require a development build on iPhone; Expo Go cannot load the local Swift module.

Pull requests and pushes to `main` run the same locked install, high-severity dependency audit, strict TypeScript, tests, Expo Doctor, iOS prebuild contract, and release-bundle checks in GitHub Actions. The workflow validates the JavaScript/native configuration boundary; physical iPhone pose quality remains a separate evidence gate.

## Physical iPhone build

Build and install the EAS development profile:

```bash
npx eas-cli@latest build --profile development --platform ios
npm run start -- --dev-client
```

Or use Xcode and a connected iPhone:

```bash
npx expo run:ios --device
npm run start -- --dev-client
```

Rebuild the native app after changing anything under `modules/`. Restarting Metro alone cannot add a new Swift module to an already installed binary.

The repository path contains a space, which currently exposes [an upstream Expo iOS quoting bug](https://github.com/expo/expo/issues/48705) during clean native builds. Version-pinned compatibility patches and `plugins/withPathSafeIosBuildScripts.js` quote the dependency, metadata-search, and app build phases automatically after install/prebuild. Keep them until the fixes ship in the SDK 57 dependency line; they deliberately fail loudly if Expo changes the affected scripts.

In a development build, open **You → Open pose benchmark lab** to choose a controlled case, import a clip, inspect the synchronized skeleton, save a one-tap visual review, and rerun the exact clip. The coverage card shares a privacy-safe aggregate report. For simulator screenshot automation, `EXPO_PUBLIC_POSE_LAB_AUTOSTART=1 npm run start -- --dev-client` opens the lab directly. An embedded internal release may set both `EXPO_PUBLIC_POSE_LAB_ENABLED=1` and `EXPO_PUBLIC_POSE_LAB_AUTOSTART=1`; an ordinary production release exposes neither. Simulator output is only a bridge/error-state smoke test; landmark quality must be judged on a physical iPhone.

With the test iPhone connected, `npm run benchmark:pull:ios -- --device "iPhone name or identifier"` reads only the validated, privacy-safe benchmark summary from PickleCoach's container and removes its temporary Mac copy after printing the report.

## Device validation checklist

For each of Serve, Dink, and Drive:

1. Follow the setup guide and open the camera.
2. Tap record, confirm the five-second countdown gives time to move into frame, then record 5–10 seconds.
3. Stop before five seconds once and confirm the temporary clip is discarded with retry guidance.
4. Play the review, retake, record again, and use the second clip.
5. Confirm the on-device processing state appears.
6. With a well-framed full body, confirm the skeleton follows the video and inspect the tracking percentages.
7. Confirm all coaching below the skeleton remains explicitly marked as demo data.
8. Crop out the feet or move far away and confirm the app asks for a retake without creating a score.
9. Let a recording reach 30 seconds and confirm auto-stop.
10. Cancel during the countdown, while idle, and while recording.
11. Deny camera access and verify retry or Settings recovery; confirm iOS never asks for microphone access.

iOS retains prior permission decisions. Toggle access in Settings, or uninstall the development build when testing the first-request state.

## Privacy and recording lifecycle

Recordings are silent, move into a PickleCoach-owned cache directory, and are never uploaded. PickleCoach does not request microphone access because audio is unnecessary for pose tracking. Retake and cancel delete discarded files immediately when possible. An accepted clip is handed to analysis only in memory—its URI is never placed in router state or local JSON—and is deleted when the analysis flow is left. Pose Lab imports move only the picker’s temporary copy into the same boundary and never modify the original Photos asset. A fresh app launch purges the owned recording directory to remove clips abandoned by a crash or forced termination. Practice history stores only the skill, timestamp, duration, and the fact that analysis is still in demo mode.

The current pose result is held in memory for the analysis screen and is not persisted. **You → Video handling** explains this lifecycle and provides separate temporary-clip, history, and full-reset controls. Future storage work should prefer derived features over raw video and must define cloud-specific consent and retention before accounts launch.

## Architecture

```text
Camera / Recording
        ↓
RecordedPracticeSession
        ↓
Ephemeral in-memory handoff
        ↓
Apple Vision landmark extraction
        ↓
Validated pose contract + quality gate
        ↓
Skeleton preview or retake
        ↓
Demo coaching (still separate and labelled)
```

Read `docs/architecture.md` before changing pose or coaching behavior. `AGENTS.md` contains the product and engineering rules.
