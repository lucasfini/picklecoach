# Next Milestone

**Validate pose tracking on 10–20 controlled pickleball clips.**

The video-to-landmarks-to-skeleton path now exists and compiles. The next question is whether it tracks real recreational players reliably enough to support measurement.

## Scope

- Use the development-only Pose Lab to record controlled cases through the production camera flow. Import an existing clip only when the condition was recorded elsewhere.
- Collect controlled Serve clips first, then representative Dink and Drive clips.
- Include useful variation: left/right handedness, indoor/outdoor lighting, clothing, camera distance, and intentional framing failures.
- Inspect the skeleton overlay through the entire motion rather than accepting aggregate coverage alone.
- Record per-clip provenance, pass/retake outcome, coverage, joint coverage, runtime, and visible failure notes.
- Tune sampling and quality thresholds only from benchmark evidence.
- Establish a small regression fixture set before feature extraction starts.

The 16-clip collection matrix and evidence template live in `docs/pose-benchmark.md`. Rows stay pending until a real clip is inspected; simulator or still-image smoke tests do not count as motion evidence.

## Exit criteria

- No accepted clip has obvious prolonged limb swaps or a missing lower body.
- Intended bad-framing clips consistently return actionable retake states.
- Re-running a clip produces materially stable landmarks and the same quality decision.
- Runtime is acceptable on the oldest supported test iPhone.
- The team can identify trustworthy frame ranges for Serve phase segmentation.

## Not in this milestone

- Technique scoring
- LLM-generated measurements
- Paddle or ball tracking claims
- Cloud upload, authentication, database, or subscriptions
- Full-match or non-MVP skill analysis

Do not replace demo coaching until this benchmark passes and objective feature contracts exist.
