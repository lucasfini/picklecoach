# Codex Instructions — PickleCoach

## Mission
Build PickleCoach into a trustworthy iOS-first AI pickleball coaching app for recreational players. The product promise is: **Get better at pickleball between lessons.**

Read `docs/product-spec.md` and `docs/architecture.md` before changing product scope or analysis architecture.

## Current state
This repository is a product prototype built with Expo Router and TypeScript. The analysis path intentionally uses demo data. Do not present the mock scores as real computer-vision output.

## Technical rules
- Keep TypeScript strict.
- Use Expo SDK-compatible packages via `npx expo install` for Expo/native dependencies.
- Prefer Expo-supported APIs unless a native dependency is justified.
- Keep screens small; extract reusable UI and domain logic.
- Do not hardcode secrets or service-role keys in the mobile app.
- Treat user video as sensitive content and minimize retention.

## Coaching safety / quality rules
- Objective measurements must come from the video/pose pipeline.
- LLM output may explain measurements but may not invent them.
- Never claim injury, medical, or biomechanical diagnosis.
- If input quality is insufficient, return a retake state instead of a score.
- Preserve metric provenance so a result can be debugged.

## MVP boundaries
Ship quality for Serve, Dink, and Drive before adding more skills.
Do not add social feeds, club management, DUPR prediction, full-match analysis, or a coach marketplace unless the product spec is explicitly updated.

## Immediate engineering backlog
1. Confirm project runs cleanly on current Expo SDK 57 dependencies.
2. Add polished onboarding for level (2.5/3.0/3.5/etc.) and goals.
3. Add `expo-camera` recording with camera-position guidance.
4. Define the analysis session schema and local mock repository.
5. Prototype pose extraction on 10–20 controlled clips.
6. Create deterministic score calculators for Serve first.
7. Replace Serve demo results with measured features behind a feature flag.
8. Add Supabase only after the local analysis contract is stable.
9. Add RevenueCat only after the core practice loop is worth paying for.

## Definition of done for a PR
- TypeScript passes.
- User-visible states include loading, empty, error/retake where relevant.
- New analysis claims are backed by measurable input features.
- No silent expansion of MVP scope.
- Update `docs/product-spec.md` for intentional product behavior changes.
