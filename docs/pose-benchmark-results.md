# Pose Benchmark Results

This log contains aggregate, privacy-safe device evidence only. It does not retain video locations, landmark frames, player technique measurements, or coaching scores.

## September 13, 2026 — Serve S01–S04 checkpoint

The first cabled report came from an iPhone 14 running iOS 26.6.2 with `VNDetectHumanBodyPoseRequest-revision-1`.

- 11 physical-device runs were collected.
- 7 runs received a complete clean visual review; none were visually flagged.
- All first four Serve cases qualified, for 4 of 16 controlled cases overall.
- S01 and S02 now form a clean exact-source pair with matching clip fingerprint, Vision revision, quality gate, and aggregate tracking values.
- Across the seven clean reviews, body coverage was 80–100%, key-joint coverage was 70–94%, average confidence was 64–73%, and processing took 798–1,562 ms.

| Case | Current judgment | Representative clean evidence | Notes |
| --- | --- | --- | --- |
| S01 | Qualified | Usable; body 100%; key joints 94%; confidence 73%; 1,233 ms | Clean physical baseline for the exact S02 source. |
| S02 | Qualified | Usable; body 100%; key joints 94%; confidence 73%; 798 ms | Same opaque clip fingerprint, Vision revision, gate, and aggregate tracking values as the reviewed S01 baseline. |
| S03 | Qualified | Usable; body 84%; key joints 78%; confidence 71%; 1,562 ms | Clean full-overlay review. |
| S04 | Qualified | Usable; body 86%; key joints 82%; confidence 71%; 1,089 ms | Clean full-overlay review. |

The qualified exact-source pair preserved the same quality decision and aggregate tracking values. Runtime was 1,233 ms for S01 and 798 ms for S02, a 435 ms difference that remains comfortably inside the observed practice-loop range. An additional pending extraction of the same source also preserved those values in 781 ms.

Wrists and elbows were frequently among the lowest-coverage joints; the left ankle also dropped sharply in one clean S02-labelled run. The sample is too small to decide whether that comes from camera position, handedness, clothing, occlusion, or the model. Thresholds should not be tuned from this checkpoint alone.

### Product decision

Apple Vision is producing fast, inspectable skeletons on real Serve motion, and the first exact-source repeat is stable. The evidence is not broad enough for technique measurements or scoring. Continue S05–S10 before defining Serve phases and objective feature contracts.

### Workflow finding

The lab originally offered continuation when any historical run had qualified the displayed case. That could label a newly recorded, still-pending S01 as S02. Continuation now requires the specific current run to be physical, clean, expectation-matching, and—where relevant—linked to its exact baseline.
