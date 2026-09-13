# First Run

Use Node 22.13 or newer, then run:

```bash
npm install
npx expo install --check
npm run typecheck
npm run start
```

The web app can validate non-camera screens. SDK 57 camera testing on a physical iPhone requires a development build:

```bash
npx eas-cli@latest build --profile development --platform ios
npm run start -- --dev-client
```

See `README.md` for the local Xcode option, the complete device checklist, and current platform limitations.
