# Codex Handoff

Read these files before changing product or analysis behavior:

1. `AGENTS.md`
2. `docs/product-spec.md`
3. `docs/architecture.md`
4. `CODEX_TASK.md`

Local camera capture is implemented for Serve, Dink, and Drive. The analysis service still returns explicitly labelled fixed demo data and does not inspect the recorded video.

The next milestone is **Serve pose-estimation proof of concept using a real recorded video.** Preserve the existing `RecordedPracticeSession → Analysis Service → Analysis Result` boundary while evaluating real measurements.
