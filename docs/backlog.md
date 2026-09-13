# MVP Backlog

## Completed

- Real camera capture for Serve, Dink, and Drive
- Recording review, retake, cancellation, and local cleanup
- Typed `RecordedPracticeSession` and analysis-service handoff
- Level-and-goals onboarding, local profile, and practice-only history
- Photo-led iOS product shell and complete capture-state redesign
- Apple Vision frame sampling and 19-joint pose contract
- Synchronized skeleton overlay and deterministic retake gate
- Runtime contract checks, pose-quality unit tests, and native/full-app compile validation
- Development-only clip import lab with repeatability comparison and privacy-bounded local summaries
- Honest processing-failure classification when Vision cannot evaluate sampled frames
- Multi-person contamination gate backed by per-frame detected-person evidence
- Ephemeral accepted-video handoff with no raw URI in router state or persisted JSON
- Skill-specific but still fixed demo coaching fixtures for Serve, Dink, and Drive
- Local-data validation, visible save/reset failure recovery, and branded route/error fallbacks
- Original native app icon, launch mark, favicon, and configured splash experience
- GitHub Actions quality gate for TypeScript, tests, Expo health, and release bundles
- Dependency hardening for the Expo Router decoder, Xcode UUID helper, and path-safe native builds
- Structured Pose Lab with the 16-case matrix, automatic device provenance, visual review, repeatability, and privacy-safe reporting
- WCAG AA palette checks, VoiceOver semantics, and maximum Accessibility text-size layout hardening
- App-owned temporary-recording cache, startup crash cleanup, and granular Privacy & Data controls
- Silent camera-only capture with no microphone permission or unused audio collection
- Bounded 720p/75 MB capture provenance and an honest iPhone-only native target
- Serialized, deduplicated local-history writes with visible save-failure recovery
- Evidence-qualified pose benchmark coverage that excludes Simulator, flagged, mismatched, and false rerun attempts
- Atomic local JSON commits for profile, practice history, and benchmark summaries
- One canonical portrait camera recipe per MVP skill, aligned between capture and the benchmark matrix
- Camera-scoped idle-timer protection for hands-off solo recording
- One-tap guided benchmark capture with private in-memory return and automatic analysis
- Frame-by-frame Pose Lab inspection with a tracking-state timeline, precise sample seeking, and weakest-joint diagnostics
- Serialized benchmark writes and unmount-safe in-flight analysis handling
- Zero-input goal-aware practice rotation using local completion history
- Processing-scoped idle-timer protection and provider-level abandoned-clip cleanup
- Retry-safe full local reset that preserves the routing profile until all other data clears
- Bounded pose-processing deadline with a distinct recoverable failure state
- Explicit internal-release Pose Lab gate that remains closed in ordinary production builds

## Now

- Collect 10–20 controlled Serve clips
- Validate overlay quality and repeatability on real motion
- Tune sampling and retake thresholds from benchmark evidence
- Populate the regression manifest in `docs/pose-benchmark.md`

## Next

- Define Serve phase segmentation and objective feature contracts
- Build deterministic Serve scoring from validated measurements
- Test Serve feedback with real players and coaches
- Replace Serve demo results behind a feature flag

## Later

- Dink and Drive measured scoring
- Accounts and persistent progress
- Payments after willingness-to-pay validation

## Explicitly later than later

- Social feed
- Coach marketplace
- Full-match analysis
- DUPR prediction
- Club SaaS
