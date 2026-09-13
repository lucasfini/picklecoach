# Pose Benchmark Results

This log contains aggregate, privacy-safe device evidence only. It does not retain video locations, landmark frames, player technique measurements, or coaching scores.

## September 13, 2026 — Serve S01–S04 checkpoint

The first cabled report came from an iPhone 14 running iOS 26.6.2 with `VNDetectHumanBodyPoseRequest-revision-1`.

- 10 physical-device runs were collected.
- 6 runs received a complete clean visual review; none were visually flagged.
- 3 of the 16 controlled cases qualified: S01, S03, and S04.
- S02 remains **needs review** because its intended exact-source S01 baseline was still pending visual review. Other clean S02-labelled runs cannot substitute for that provenance.
- Across the six clean reviews, body coverage was 80–100%, key-joint coverage was 70–94%, average confidence was 64–73%, and processing took 798–1,562 ms.

| Case | Current judgment | Representative clean evidence | Notes |
| --- | --- | --- | --- |
| S01 | Qualified | Usable; body 100%; key joints 85%; confidence 64%; 1,239 ms | A clean, expectation-matching physical run exists. |
| S02 | Needs review | Usable; body 100%; key joints 94%; confidence 73%; 798 ms | The matching source was rerun in 781 ms with the same gate and aggregate coverage, but the associated S01 baseline was not reviewed clean. This is encouraging repeatability evidence, not a qualified protocol pair. |
| S03 | Qualified | Usable; body 84%; key joints 78%; confidence 71%; 1,562 ms | Clean full-overlay review. |
| S04 | Qualified | Usable; body 86%; key joints 82%; confidence 71%; 1,089 ms | Clean full-overlay review. |

The duplicate extraction noted for S02 differed by only 17 ms while preserving the same gate and aggregate coverage. This supports deterministic extraction for that clip, but it does not waive the exact S01→S02 review requirement.

Wrists and elbows were frequently among the lowest-coverage joints; the left ankle also dropped sharply in one clean S02-labelled run. The sample is too small to decide whether that comes from camera position, handedness, clothing, occlusion, or the model. Thresholds should not be tuned from this checkpoint alone.

### Product decision

Apple Vision is producing fast, inspectable skeletons on real Serve motion. The evidence is not broad enough for technique measurements or scoring. Complete a correctly reviewed S01→S02 pair, then continue S05–S10 before defining Serve phases and objective feature contracts.

### Workflow finding

The lab originally offered continuation when any historical run had qualified the displayed case. That could label a newly recorded, still-pending S01 as S02. Continuation now requires the specific current run to be physical, clean, expectation-matching, and—where relevant—linked to its exact baseline.
