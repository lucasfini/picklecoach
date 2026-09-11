# Architecture — Proposed

## Client
- React Native + Expo SDK 57
- Expo Router
- TypeScript
- iOS-first UI, Android-compatible codebase

## Phase 1: Product prototype
Current repository implements the navigation and UX using deterministic demo analysis.

Goal: validate the flow before coupling product design to a computer-vision implementation.

## Phase 2: Capture
Add `expo-camera` using the SDK-compatible version via `npx expo install expo-camera`.

Capture requirements:
- landscape option for analysis clips
- full-body framing guide
- 5-repetition instruction
- clip duration cap
- client-side validation where possible

## Phase 3: Pose pipeline
Prototype two implementations and benchmark them on real pickleball footage:
1. On-device pose estimation if practical for target iPhones
2. Server-side pose extraction for faster iteration / stronger models

The output of this layer should be structured numeric data, e.g.:
```json
{
  "skill": "serve",
  "repetitions": 5,
  "features": {
    "contactSpacing": 0.68,
    "kneeFlexion": 0.82,
    "balance": 0.87,
    "followThrough": 0.61,
    "consistency": 0.74
  }
}
```

## Phase 4: Coaching engine
Deterministic rules rank measured weaknesses and choose from a reviewed drill library.

An LLM can:
- explain the measured issue in friendly language
- personalize wording to player level
- summarize progression

An LLM must not invent measurements or select unsupported technical diagnoses.

## Backend
Planned:
- Supabase Auth
- Postgres for profiles, sessions, feature vectors, scores, plans
- Supabase Storage only if raw video needs temporary server upload
- Edge/server functions for analysis orchestration
- RevenueCat for App Store subscription state

## Data retention
Prefer storing extracted features and results over long-term raw video. Provide deletion controls from V1 once accounts exist.
