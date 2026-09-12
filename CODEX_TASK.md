# First Codex Task — Real Practice Capture

## Status

Complete.

## Delivered

- Expo SDK 57 dependencies validated and pinned to compatible versions.
- Real rear-camera video recording for Serve, Dink, and Drive.
- Practice-specific setup instructions and full-body framing guidance.
- Camera and microphone permission handling for loading, granted, denied, retry, and Settings recovery states.
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
- Expo config introspection for iOS camera/microphone usage descriptions and Android camera/audio permissions

Real camera hardware, operating-system permission prompts, recording playback, and file cleanup still require the physical-device checklist in `README.md` before merge.

## What remains mocked

All technique scores, detected opportunities, progress comparisons, and drill selection are fixed demo content. No biomechanical value is calculated from the recording, and no LLM or computer-vision service is used.

## Next recommended milestone

**Serve pose-estimation proof of concept using a real recorded video.**
