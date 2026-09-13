# First Codex Task — Real Practice Capture (Archived)

## Status

Complete.

## Delivered

- Expo SDK 57 dependencies validated and pinned to compatible versions.
- Real rear-camera video recording for Serve, Dink, and Drive.
- Practice-specific setup instructions and full-body framing guidance.
- Camera-only permission handling for loading, granted, denied, retry, and Settings recovery states; capture is deliberately silent.
- Recording indicator, elapsed time, manual stop, cancellation, and automatic 30-second stop.
- Local video review with Retake and Use Video actions.
- Immediate cleanup of canceled and retaken recordings.
- Typed `RecordedPracticeSession` handoff containing practice type, local URI, timestamp, duration, and capture metadata.
- Analysis service boundary that currently returns fixed demo data and does not inspect the video.
- Missing-recording and camera-unavailable recovery states.
- Physical-iPhone development-build instructions in `README.md`.

## Validation

- `npm run typecheck`
- `npx expo install --check`
- `npx expo-doctor`
- iOS production bundle export
- Web production bundle export
- Expo config introspection for required camera/photo usage descriptions and the deliberate absence of microphone/audio-recording permissions

The core camera/review handoff was exercised on a physical iPhone before this milestone merged. Keep the broader checklist in `README.md` as regression coverage.

## What remains mocked

All technique scores, detected opportunities, progress comparisons, and drill selection remain fixed demo content. A later milestone added real Apple Vision body landmarks and a skeleton preview, but it still calculates no biomechanical or coaching value.

## Next recommended milestone

The pose-estimation proof of concept now compiles. The active milestone is **pose-quality benchmarking on 10–20 controlled clips** before any measured scoring.
