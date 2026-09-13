# Codex Handoff

Read these files before changing product or analysis behavior:

1. `AGENTS.md`
2. `docs/product-spec.md`
3. `docs/architecture.md`
4. `docs/next-milestone.md`
5. `CODEX_TASK.md`

Silent, camera-only capture is implemented for Serve, Dink, and Drive; do not reintroduce microphone permission without a measured product need and explicit privacy review. Camera files are adopted into the app-owned temporary-recording directory, accepted iPhone clips cross an ephemeral in-memory boundary, then pass through the app-local Apple Vision module, strict TypeScript contract validation, a quality gate, and a synchronized skeleton preview or retake state. Do not put the raw URI back into route parameters or persistent JSON, and preserve the startup purge plus Privacy & Data controls.

The coaching service still returns explicitly labelled fixed demo data and does not derive scores from the clip. Keep that separation intact.

The development-only Pose Lab implements the 16-case matrix, automatic iPhone/iOS provenance, aggregate quality capture, one-tap visual review, repeatability comparison, and privacy-safe report sharing. The next milestone is **running its pose-quality benchmark on 10–20 controlled physical-iPhone clips.** Validate the skeleton before implementing Serve phases, objective features, or scoring. Authentication, cloud data, storage, hosting, and payments remain deferred.
