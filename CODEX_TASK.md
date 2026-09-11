# First Codex Task — Real Practice Capture

Implement the first real MVP slice without expanding scope.

## Goal
Turn the current demo recording screen into a real iPhone capture flow for Serve, Dink, and Drive while leaving analysis results behind the existing demo/feature-flag path.

## Requirements
1. Add the Expo SDK-compatible `expo-camera` dependency.
2. Request camera permission with a clear denied-permission state.
3. Show a live camera preview on `app/record/[shot].tsx`.
4. Add framing guidance appropriate to the selected shot.
5. Record a short video clip with a sensible duration cap.
6. Show recording state, elapsed time, stop, retake, and continue actions.
7. Keep the raw recording local for now; do not add Supabase or upload infrastructure yet.
8. Define a typed `PracticeCapture` domain model containing skill, local URI, duration, createdAt, and capture metadata.
9. Continue to the existing analysis screen using demo analysis only, but make the UI explicitly state that analysis is mocked.
10. Preserve the MVP and safety rules in `AGENTS.md`.

## Acceptance criteria
- TypeScript passes.
- Camera permission success, denied, and unavailable states are handled.
- A user can record, review/retake, and continue with a Serve clip on a physical iPhone development build.
- Dink and Drive reuse the same capture architecture.
- No backend, authentication, subscriptions, or pose model is added in this task.
