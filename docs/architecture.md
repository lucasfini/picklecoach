# PickleCoach Architecture

## Client

- React Native with Expo SDK 57
- Expo Router
- Strict TypeScript
- iOS-first UI with Android-compatible product code where practical
- Expo prebuild / Continuous Native Generation; generated `ios/` and `android/` projects are not source-controlled

## Product shell

The current app has a local-first onboarding profile, Today practice library, capture flow, analysis states, practice-only progress, and profile controls. Local JSON repositories provide replaceable boundaries for the future account database without making the prototype depend on a backend. Native writes commit through a same-directory temporary file and atomic replacement so interruption cannot leave half-written profile, history, or benchmark JSON.

The visual system uses original photography, large editorial type, an off-white canvas, rounded modules, forest/mint/lime accents, and a deliberately small number of actions per screen. See `docs/design-direction.md`.

## Capture boundary

Capture uses SDK-compatible `expo-camera`, `expo-video`, and `expo-file-system` APIs.

```text
Camera / Recording
        ↓
RecordedPracticeSession
        ↓
Pose estimation service
        ↓
PoseExtractionResult
        ↓
Skeleton preview or retake
```

`RecordedPracticeSession` carries the selected practice type, temporary local video URI, recording timestamp, duration, and capture metadata, including the invariants that audio was not captured and the guided take was portrait. Capture owns its get-into-position countdown, silent recording, cancellation, minimum-duration rejection, review, retake cleanup, and handoff. A scoped keep-awake lock prevents the idle timer from interrupting a hands-off set and releases as soon as the camera component unmounts. The app requests camera access only because neither pose tracking nor coaching uses audio. It records at a fixed 720p quality with a 75 MB safety cap rather than inheriting a device’s potentially oversized default. The iOS camera layer uses aspect-fill internally, so PickleCoach constrains that layer to the recorded portrait 9:16 bounds; taller iPhone screens letterbox the preview instead of silently cropping its sides. Those settings are retained as capture provenance. Clips shorter than five seconds are deleted before a session is created. A valid camera result is moved into a dedicated `picklecoach-recordings` cache directory before review, making cleanup narrowly scoped and auditable. The analysis screen owns the accepted clip and deletes it when that flow ends.

The accepted session crosses screens through `ActivePracticeSessionProvider`, which is deliberately ephemeral. Navigation contains only the opaque session ID and practice type; the video URI, capture timestamp, and duration never enter router state or persistent JSON. A missing or mismatched handoff becomes a fresh-recording recovery state and atomically discards any stale active clip. Provider teardown also deletes an abandoned handoff as a final lifecycle backstop.

## On-device pose proof of concept

`modules/picklecoach-pose` is an app-local Expo module. Its Swift implementation uses `AVAssetReaderTrackOutput` to decode the accepted local video and reuses one Apple Vision `VNDetectHumanBodyPoseRequest` across sampled frames.

Current configuration:

- iOS only
- Target sampling rate: 8 frames per second
- Maximum samples: 240
- Minimum landmark confidence: 0.25
- 19 Apple Vision 2D body joints
- Display-oriented, top-left normalized coordinates
- Largest detected body selected when multiple people appear

Every frame retains its timestamp, body-present flag, detected-person count, accepted landmarks, confidence, and frame-level Vision failure when relevant. Result provenance includes the source, Vision request revision, processing timestamp, video dimensions and duration, and decoded/sampled frame counts.

## Pose quality gate

The proof of concept returns `usable` only when all current conditions pass:

- At least 5 frames were sampled.
- Vision processing fails on no more than 30% of sampled frames.
- A body was found.
- Multiple people appear in no more than 10% of sampled frames; crowded clips are rejected before the largest-body heuristic can silently switch subjects.
- A body appears in at least 70% of sampled frames.
- The 12 coaching-critical shoulder, elbow, wrist, hip, knee, and ankle joints appear in at least 55% of all possible frame/joint slots.
- Average detected body height occupies at least 30% of the normalized frame.

Swift calculates this gate first. TypeScript parses every native value, bounds frame counts, duration, dimensions, provenance, and detected people, strictly validates coordinates and timestamps, recomputes the quality summary from the frame-level landmarks, and rejects a contradictory native `usable` flag. A Vision request failure is distinguished from a genuinely missing player, so an internal processing problem never masquerades as bad user framing. Invalid or inadequate input always becomes an error/retake path rather than a score.

These are prototype thresholds, not validated coaching thresholds. They must be benchmarked on 10–20 controlled clips across Serve, Dink, and Drive before measured feature work relies on them.

## Skeleton preview

The analysis UI plays the local clip through `expo-video`, selects the nearest sampled pose frame by timestamp, and draws a synchronized skeleton in the video's contained display rectangle. It exposes tracking coverage, key-joint coverage, and frames sampled. It does not infer paddle position, ball position, repetitions, technique, or biomechanics.

A scoped keep-awake lock is mounted only while pose extraction is active in the player flow or development lab. It prevents longer on-device work from being interrupted by the idle timer and releases as soon as processing reaches a terminal state or the screen leaves.

The TypeScript service applies a 60-second processing deadline around the native operation. Missing native support, malformed native output, native failure, and deadline expiry remain distinct recoverable outcomes; none can fall through to measured or demo-labelled coaching as if tracking passed.

## Coaching separation

The demo analysis adapter remains independent and deliberately does not inspect the video. Pose extraction and demo loading may run concurrently, but their outputs never merge:

```text
RecordedPracticeSession ──→ Apple Vision ──→ real landmarks / retake
          │
          └───────────────→ demo adapter ──→ labelled example coaching
```

All current scores, explanations, priorities, and drills are fixed per-skill demo fixtures. They preview relevant Serve, Dink, or Drive product language, but do not inspect or describe the clip. Measured coaching cannot replace them until a feature contract and deterministic calculators are validated.

## Next analysis layers

After the pose benchmark passes:

1. Define phase/repetition segmentation with inspectable timestamps.
2. Extract objective features with units, confidence, source frames, and model revision.
3. Build deterministic Serve calculators first.
4. Expose measured Serve results behind a feature flag.
5. Repeat validation for Dink and Drive before enabling their scoring.

An LLM may eventually explain measured facts in player-level language. It may not create measurements, fill missing joints, diagnose injury, or choose a claim unsupported by the deterministic result.

## Planned backend

Deferred until the local analysis contract is stable:

- Supabase Auth
- Postgres for profiles, sessions, feature vectors, scores, and plans
- Object storage only if temporary raw-video upload is genuinely required
- Server/edge functions for analysis orchestration
- RevenueCat for App Store subscription state

No OpenAI or service-role key belongs in the mobile bundle. Any future model call must go through a controlled server boundary.

## Data retention

The prototype persists only the validated local player profile and capped practice-history metadata. Failed writes are reported to their calling flow instead of being treated as successful. JSON updates stage in the same sandbox directory and move into place atomically; app startup and full reset remove any staging file left by termination between those steps. Persisted schemas reject unknown fields and bound identifiers so raw clip data cannot be smuggled into compact records. Practice-history and benchmark mutations are serialized so overlapping append, review, clear, and reset operations cannot silently clobber a newer local value. The development-only Pose Lab also keeps at most 100 compact benchmark summaries containing a controlled-case ID, opaque clip fingerprint, aggregate and per-key-joint coverage, runtime, device/model provenance, and a bounded human-review label. It never stores a video URI, filename, free-form observation, or landmark frames. Older aggregate-only summaries remain readable; new reports include the three weakest tracked key joints for threshold analysis. Leaving the lab invalidates an in-flight extraction before it can persist a late attempt. Its shareable report is generated only from that validated summary schema.

Benchmark coverage is evidence-qualified rather than attempt-counted: a case requires a clean human overlay review on a physical iPhone and the expected gate. The lab can launch the production guided camera and receive the accepted clip through the same in-memory active-session boundary; only session and case IDs enter navigation, and no benchmark capture enters practice history. The exact-source S02 repeatability case additionally requires the same opaque clip fingerprint, Vision revision, and quality decision as a clean S01 baseline. Simulator output, mismatches, and flagged overlays stay in the log but cannot advance coverage. Selecting an earlier case never restores its raw clip or frame-level landmarks, but the lab surfaces that case’s latest persisted aggregate gate, coverage, confidence, runtime, and review state next to the selector. If the current run is still awaiting visual review, changing the case or skill requires explicit discard confirmation before its temporary clip is deleted. Pose Lab is available automatically in development, can be included in a specifically flagged internal release build, and remains absent from an ordinary production release. A cable collector can request only the schema-validated benchmark JSON from the app container and removes its temporary local copy after printing the same privacy-safe report used by the share sheet.

Raw video lives only in the app-owned cache while capture/review/analysis is active. The development Pose Lab also moves the system picker’s temporary copy into this same owned boundary; the original Photos-library asset is never modified. Retake, cancel, short-clip rejection, stale-session replacement, analysis exit, Pose Lab exit/replacement, and provider teardown delete the affected copy; provider startup purges the owned directory to remove crash leftovers without touching unrelated Expo caches. The Privacy & Data screen exposes the lifecycle and separate controls for temporary clips, practice metadata, and a full local reset. Full reset clears non-routing data first and resets the profile only after those operations succeed, so a partial failure remains recoverable on the current screen. Frame-level pose data is not persisted. Future architecture should store compact derived features and provenance instead of raw video wherever possible, with explicit consent, deletion, expiration, and account-export behavior before cloud launch.

## Primary technical references

- [Apple Vision: `VNDetectHumanBodyPoseRequest`](https://developer.apple.com/documentation/vision/vndetecthumanbodyposerequest)
- [Apple: Detecting Human Body Poses in Images](https://developer.apple.com/documentation/Vision/detecting-human-body-poses-in-images)
- [Apple: Detecting Human Actions in a Live Video Feed](https://developer.apple.com/documentation/createml/detecting-human-actions-in-a-live-video-feed)
- [Apple AVFoundation: `AVAssetReaderTrackOutput`](https://developer.apple.com/documentation/avfoundation/avassetreadertrackoutput)
- [Expo: Add custom native code](https://docs.expo.dev/workflow/customizing/)
- [Expo Modules API](https://docs.expo.dev/modules/module-api/)
