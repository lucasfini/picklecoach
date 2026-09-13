# Validation Notes

Validated on September 13, 2026 with Node 22.23.2.

## Automated and build validation

- `npm run typecheck` passes in strict mode.
- `npm test` passes 32 tests covering the pose contract, contradictory quality claims, processing/framing retakes, malformed and bounded native data, timestamp synchronization, per-joint tracking coverage, the bounded extraction deadline, internal-build Pose Lab access, compact benchmark persistence and visual-review provenance, evidence-qualified physical-device coverage, privacy-safe benchmark reporting, opaque clip fingerprints, exact-source rerun integrity, goal-aware practice rotation and local week boundaries, minimum capture duration, privacy-safe navigation, per-skill demo fixtures, bounded/deduplicated local profile and activity data, WCAG AA theme contrast, silent-capture/native-target configuration, Expo Router decoder compatibility, and linear-time handling of long malformed URL input.
- Expo Doctor passes all 21 checks.
- Expo SDK dependency validation reports compatible packages.
- Production JavaScript exports succeed for iOS and web.
- An iOS release export with the explicit internal Pose Lab and autostart flags also succeeds; ordinary release exports keep that tool inaccessible.
- The complete internal Release workspace also compiles, links, validates, and embeds `main.jsbundle` for a generic physical iPhone with signing disabled. The same headless environment cannot authorize the login-keychain private key, so Xcode must perform the final signed install.
- The checked-in GitHub Actions workflow runs the locked install, rejects high/critical dependency advisories, checks strict TypeScript, runs all 32 tests and Expo Doctor, verifies the generated iOS contract, and builds both release exports for pull requests and pushes to `main`.
- The local Swift `PickleCoachPose` scheme builds for the iOS simulator SDK.
- The complete `PickleCoach` workspace builds and links the local pose module for the iOS simulator SDK.
- Expo configuration contains camera/photo descriptions, explicitly removes iOS microphone usage and Android audio-recording permission, and includes Expo Video, Expo Image Picker, Expo Font, the opaque 1024 px app icon, adaptive Android artwork, and the native splash-screen plugin.
- The native contract deliberately targets iPhone rather than advertising an untested iPad layout, and declares that the app uses no non-exempt encryption.

Native build output contains warnings from Expo/React Native dependencies, including future Swift 6 concurrency warnings. No warning originated from `PickleCoachPose`, and the current Swift 5 build succeeds. A signed physical-device attempt compiled through the custom pose module and reached final framework signing using the recovered local provisioning profile; the headless session could not authorize the login-keychain private key. A separate unsigned internal Release build then completed end to end, including app validation and its embedded JavaScript bundle. Neither build was installed by automation and neither is counted as runtime evidence.

The workspace lives below `Coding Projects`, which exercises [an open upstream Expo bug](https://github.com/expo/expo/issues/48705) where generated iOS build phases lose quoting around paths containing spaces. Version-pinned `expo-constants`/React Native patches and a local config plugin cover the dependency, metadata-search, and app build phases. Clean prebuild validation must keep exercising this real path until Expo ships the upstream fixes.

## Visual validation

The following screens were inspected on an iPhone simulator:

- Welcome, level selection, and goal selection
- Today with the photo-led practice library
- Progress empty state and local-profile screen
- Serve and Dink camera setup
- Camera permission gate and camera-unavailable state
- Development-only Pose Lab empty and processing-failure states
- Welcome at the maximum iOS Accessibility content-size category with Increase Contrast enabled

The maximum-text pass found and corrected unbounded brand scaling, a non-scrolling welcome panel, a fixed onboarding footer that could overlap choices, and horizontal profile rows that could collide. Display type now has a deliberate upper scale while controls and explanatory content remain in scrollable layouts.

Core camera capture, review, retake, and Use Video behavior was exercised on a physical iPhone before the capture PR merged.

## Native smoke evidence

A generated five-second local video was decoded through the installed `PickleCoachPose` module on iOS 18.5 and iOS 26.5 simulators. Both runs decoded 150 source frames and sampled 38 frames under the original cadence. Apple Vision returned `VNErrorInternalError` while setting up `VNDetectHumanBodyPoseRequest` in Simulator, so this fixture correctly produced a `processing-failed` retake rather than a false “player missing” claim. The Pose Lab rendered that decision and persisted only a compact aggregate benchmark record; the saved JSON contained neither the video URI nor frame-level landmarks. Sampling has since been anchored to the first frame to prevent cadence drift; that change compiles for Simulator and device but still needs a real-device runtime pass.

This proves native autolinking, video decoding, JS/native contract handling, the honest failure path, and privacy-bounded persistence. It does **not** prove landmark or skeleton quality, because Simulator did not run the body-pose model and the source was a static visual fixture rather than real motion.

## Still requiring real-device evidence

The new Apple Vision runtime has compiled but has not yet been benchmarked on real Serve motion. Before any technique measurement work:

- Run the synchronized skeleton overlay on 10–20 controlled clips.
- Verify good clips pass and intentional framing failures return the correct retake state.
- Check left/right-handed players, indoor/outdoor lighting, clothing variation, and the oldest supported iPhone.
- Confirm repeat runs make stable quality decisions.

Use the collection matrix and evidence rules in `docs/pose-benchmark.md`; do not begin Serve scoring until its exit criteria are met.

The existing camera regression checklist should also continue to cover the five-second runway, cancellation during countdown, sub-five-second cleanup, 30-second auto-stop, cancel while recording, first-time camera permission denial/recovery, absence of a microphone prompt/audio track, and the new move into/app-start purge of the dedicated temporary-recording cache.

## Dependency advisories

`npm audit` reports three moderate dependency paths to `decode-uri-component@0.2.2` through Expo Router. The published automatic fix would downgrade Expo Router across incompatible SDK generations, so it was not applied. Instead, `patch-package` installs the upstream `0.5.0` linear-time decoder implementation while retaining the CommonJS interface required by `query-string@7`; routing compatibility and a 25,000-token malformed-input case are regression tested. npm's version-based audit cannot recognize that source backport, so the report remains until Expo Router updates its dependency graph.

The separate `uuid@7.0.3` Xcode-project advisory is removed with a lockfile override to `uuid@11.1.1`. Xcode uses the compatible CommonJS `v4()` API, and a clean Expo iOS prebuild succeeds with the override. CI runs `npm audit --audit-level=high` so a future high or critical advisory fails the quality gate while this documented moderate version false-positive remains visible.
