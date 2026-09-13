# Pose Benchmark Protocol

This is the evidence plan for deciding whether PickleCoach's Apple Vision skeleton is trustworthy enough to support measurements. It is not a scoring dataset, and a row is never marked complete from Simulator output or a still-image fixture.

## Run protocol

1. Record a 5–30 second clip containing one player and the stated condition.
2. Open **You → Open pose benchmark lab** in a physical-iPhone development build.
3. Select the matching matrix case and tap **Record [case]** to use the guided camera. The accepted take returns to the lab and starts automatically. Choosing an existing Photos clip remains available for edge cases recorded elsewhere.
4. Watch the overlay through the entire motion.
5. Mark the overlay **clean** or flag the visible issue types. The app records the gate, aggregate metrics, runtime, iPhone model, iOS version, and review—without retaining the clip.
6. For S01, use the offered one-tap exact-source rerun to generate S02 and its repeatability comparison.
7. Use the share button in Benchmark Coverage to export a privacy-safe text report. The report contains only opaque fingerprints and aggregate evidence; it cannot contain a video URI or landmark frames.

When the iPhone is cabled to the development Mac, the same validated report can be collected without using the share sheet:

```bash
npm run benchmark:pull:ios -- --device "iPhone name or identifier"
```

The command requests only the benchmark-summary JSON from PickleCoach's app container, rejects malformed or over-broad records, prints the existing privacy-safe report, and deletes its temporary Mac copy. It never copies a recording, profile, or practice history.

A case is counted as **qualified** only after a clean full-overlay review on a physical iPhone and an outcome matching the controlled expectation. Use the tracking timeline, sampled-frame controls, and lowest-joint coverage panel to inspect gaps, multi-person frames, and limb placement instead of judging only the aggregate percentages. Per-joint coverage is a tracking diagnostic, never a technique score. Simulator runs, pending/flagged visual reviews, unexpected gates, and an S02 rerun that does not match S01's exact clip fingerprint and Vision revision remain visibly marked for review.

An aggregate `usable` result is insufficient when the overlay visibly swaps limbs, jumps between people, loses the lower body for a meaningful phase, or drifts away from the player.

## Planned 16-clip matrix

| ID | Skill | Controlled condition | Expected gate | Status |
| --- | --- | --- | --- | --- |
| S01 | Serve | Right-handed, outdoor shade, full body, rear 45° | Usable candidate | Pending |
| S02 | Serve | Exact S01 source rerun | Same as S01 | Pending |
| S03 | Serve | Left-handed, outdoor shade, full body | Usable candidate | Pending |
| S04 | Serve | Right-handed, bright indoor court | Usable candidate | Pending |
| S05 | Serve | Right-handed, low/uneven indoor light | Evidence decides | Pending |
| S06 | Serve | Player deliberately too far from phone | Retake: subject too small | Pending |
| S07 | Serve | Both feet deliberately cropped | Retake: body not fully visible | Pending |
| S08 | Serve | Paddle arm deliberately exits frame | Retake: body not fully visible | Pending |
| S09 | Serve | Second player deliberately crosses the frame | Retake: multiple people | Pending |
| S10 | Serve | Full body at alternate supported camera distance | Usable candidate | Pending |
| D01 | Dink | Right-handed, outdoor, full body | Usable candidate | Pending |
| D02 | Dink | Left-handed, bright indoor court | Usable candidate | Pending |
| D03 | Dink | Lower legs deliberately cropped | Retake: body not fully visible | Pending |
| R01 | Drive | Right-handed, outdoor, full body | Usable candidate | Pending |
| R02 | Drive | Left-handed, bright indoor court | Usable candidate | Pending |
| R03 | Drive | Fast swing in uneven light | Evidence decides | Pending |

## Evidence record

The Pose Lab now collects the structured portion of this record automatically. Use the exported report for the exact run values; only add prose when a visible defect needs context.

| Field | Value |
| --- | --- |
| Clip ID | Pending |
| Device / iOS | Captured automatically |
| Vision source version | Pending |
| Run 1 decision | Captured automatically |
| Run 2 decision | Captured automatically |
| Body coverage, run 1 / run 2 | Captured automatically |
| Key-joint coverage, run 1 / run 2 | Captured automatically |
| Average confidence, run 1 / run 2 | Captured automatically |
| Runtime, run 1 / run 2 | Captured automatically |
| Visible limb swaps or jumps | One-tap visual review |
| Missing critical phase / joints | One-tap visual review |
| Final benchmark judgment | Pending |

## Exit criteria

- Intended good-framing clips have continuous, visually correct landmarks through the useful motion.
- Intended failure clips consistently produce the appropriate retake outcome.
- Exact reruns keep the same decision and do not show materially different tracking defects.
- The oldest supported test iPhone completes within an acceptable practice-loop delay.
- Serve clips reveal frame ranges trustworthy enough to define phase-segmentation and feature contracts.

Until these criteria pass, PickleCoach keeps all technique scores in explicitly labelled demo mode.
