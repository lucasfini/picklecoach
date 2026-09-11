# PickleCoach

**Get better at pickleball between lessons.**

PickleCoach is an iOS-first React Native / Expo app concept for recreational pickleball players. It analyzes short controlled practice clips, identifies the highest-priority technical improvement, gives the player one drill, and tracks progress over time.

## Status
This repository currently contains a working product-flow prototype with demo analysis data. Real camera capture and pose estimation are the next technical milestones.

## Stack
- Expo SDK 57
- React Native 0.86
- React 19.2
- Expo Router
- TypeScript

## Run locally
Use Node 22.13+ for Expo SDK 57.

```bash
npm install
npx expo install --check
npm run start
```

For native development builds later:

```bash
npx eas-cli@latest build --profile development --platform ios
```

## Product flow
Coach → choose Serve/Dink/Drive → camera setup → recording → measured analysis → one priority → one drill → progress tracking.

## Important
The scores in the initial prototype are demo data. See `docs/architecture.md` before implementing computer vision or AI coaching.

## Codex
`AGENTS.md` contains the product and engineering rules for Codex. Open the repository as a Codex project after pushing it to GitHub.
